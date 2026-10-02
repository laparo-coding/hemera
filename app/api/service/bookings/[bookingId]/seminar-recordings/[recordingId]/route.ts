/**
 * GET/PUT /api/service/bookings/[bookingId]/seminar-recordings/[recordingId]
 * Canonical workflow state for the Aither transcription worker
 * (Feature 012-video-transcription)
 *
 * PUT is idempotent via the (bookingId, recordingId) unique key and the
 * Idempotency-Key header. participantUserId is derived from the booking.
 * Trace events are appended on status transitions (FR-025) and contain
 * only IDs, statuses, timestamps, and operator identity.
 */

import { createHash } from 'node:crypto';
import { Prisma, SeminarRecordingWorkflowStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { serializeWorkflow } from '@/lib/services/seminar-recording-workflow';
import { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';
import {
  createServiceApiErrorResponse,
  createServiceApiSuccessResponse,
  handleOptionsRequest,
} from '@/lib/utils/service-api-response';

export const dynamic = 'force-dynamic';

const WorkflowStatusSchema = z.nativeEnum(SeminarRecordingWorkflowStatus);

const CleanupStatusSchema = z.enum([
  'PENDING',
  'COMPLETE',
  'RETRYABLE_FAILURE',
  'NOT_REQUIRED',
]);

const DeletionReasonSchema = z.enum([
  'BOOKING_DELETED',
  'PARTICIPATION_DELETED',
  'OPERATOR_ABANDONED',
]);

const WorkflowUpdateSchema = z
  .object({
    status: WorkflowStatusSchema,
    recordingDate: z.string().datetime(),
    queuedAt: z.string().datetime().optional(),
    firstProviderAttemptAt: z.string().datetime().nullish(),
    assemblyAiTranscriptId: z.string().nullish(),
    assemblyAiStatus: z.string().nullish(),
    sourceBlobPathname: z.string().nullish(),
    muxAssetId: z.string().nullish(),
    muxPlaybackId: z.string().nullish(),
    muxPlaybackUrl: z.string().url().nullish(),
    transcriptBlobPathname: z.string().nullish(),
    lastErrorCode: z.string().nullish(),
    stageAttemptCounts: z
      .record(z.string(), z.number().int().min(0).max(5))
      .optional(),
    assemblyAiCleanupStatus: CleanupStatusSchema.optional(),
    sourceBlobCleanupStatus: CleanupStatusSchema.optional(),
    reviewedSpeakerMapping: z.record(z.string(), z.string()).nullish(),
    reviewedBy: z.string().nullish(),
    reviewedAt: z.string().datetime().nullish(),
    deletionRequestedAt: z.string().datetime().nullish(),
    deletionConfirmedAt: z.string().datetime().nullish(),
    deletionReason: DeletionReasonSchema.nullish(),
  })
  .strict();

const ALLOWED_TRANSITIONS: Record<
  SeminarRecordingWorkflowStatus,
  SeminarRecordingWorkflowStatus[]
> = {
  QUEUED: ['TRANSCRIBING', 'RETRYABLE_FAILURE', 'FAILED', 'DELETION_PENDING'],
  TRANSCRIBING: [
    'TRANSCRIPT_READY',
    'REVIEW_REQUIRED',
    'RETRYABLE_FAILURE',
    'FAILED',
    'DELETION_PENDING',
  ],
  TRANSCRIPT_READY: [
    'REVIEW_REQUIRED',
    'PUBLISHING',
    'RETRYABLE_FAILURE',
    'FAILED',
    'DELETION_PENDING',
  ],
  REVIEW_REQUIRED: ['PUBLISHING', 'DELETION_PENDING'],
  PUBLISHING: ['READY', 'RETRYABLE_FAILURE', 'FAILED', 'DELETION_PENDING'],
  READY: ['DELETION_PENDING'],
  RETRYABLE_FAILURE: [
    'QUEUED',
    'TRANSCRIBING',
    'TRANSCRIPT_READY',
    'PUBLISHING',
    'FAILED',
    'DELETION_PENDING',
  ],
  FAILED: ['DELETION_PENDING'],
  DELETION_PENDING: ['DELETED'],
  DELETED: [],
};

export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string; recordingId: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { bookingId, recordingId } = await params;
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/bookings/${bookingId}/seminar-recordings/${recordingId}`
  );
  const logger = createApiLogger(context);

  try {
    const authResult = await authenticateServiceRequest(request);
    if ('error' in authResult) {
      return await handleServiceAuthError(authResult, logger, requestId);
    }
    const { userId, role } = authResult;

    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const workflow = await prisma.seminarRecordingWorkflow.findUnique({
      where: { bookingId_recordingId: { bookingId, recordingId } },
    });

    if (!workflow) {
      return await createServiceApiErrorResponse(
        'Workflow not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      serializeWorkflow(workflow)
    );
  } catch (error) {
    logger.error(
      'Workflow read failed',
      error instanceof Error ? error : new Error('unknown')
    );
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string; recordingId: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { bookingId, recordingId } = await params;
  const context = createRequestContext(
    requestId,
    'PUT',
    `/api/service/bookings/${bookingId}/seminar-recordings/${recordingId}`
  );
  const logger = createApiLogger(context);

  try {
    const authResult = await authenticateServiceRequest(request);
    if ('error' in authResult) {
      return await handleServiceAuthError(authResult, logger, requestId);
    }
    const { userId, role } = authResult;

    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Idempotency-Key header is required by the contract
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey?.trim()) {
      return await createServiceApiErrorResponse(
        'Missing Idempotency-Key header',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
        userId,
        role
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return await createServiceApiErrorResponse(
        'Invalid JSON body',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
        userId,
        role
      );
    }

    let update;
    try {
      update = WorkflowUpdateSchema.parse(body);
    } catch (error) {
      logger.warn('Invalid workflow update', {
        bookingId,
        recordingId,
        issues: error instanceof z.ZodError ? error.issues.length : 'unknown',
      });
      return await createServiceApiErrorResponse(
        'Invalid workflow update',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
        userId,
        role
      );
    }

    const data = {
      status: update.status,
      recordingDate: new Date(update.recordingDate),
      queuedAt: update.queuedAt ? new Date(update.queuedAt) : undefined,
      firstProviderAttemptAt:
        update.firstProviderAttemptAt !== undefined
          ? update.firstProviderAttemptAt
            ? new Date(update.firstProviderAttemptAt)
            : null
          : undefined,
      assemblyAiTranscriptId:
        update.assemblyAiTranscriptId === undefined
          ? undefined
          : update.assemblyAiTranscriptId,
      assemblyAiStatus:
        update.assemblyAiStatus === undefined
          ? undefined
          : update.assemblyAiStatus,
      sourceBlobPathname:
        update.sourceBlobPathname === undefined
          ? undefined
          : update.sourceBlobPathname,
      muxAssetId:
        update.muxAssetId === undefined ? undefined : update.muxAssetId,
      muxPlaybackId:
        update.muxPlaybackId === undefined ? undefined : update.muxPlaybackId,
      muxPlaybackUrl:
        update.muxPlaybackUrl === undefined ? undefined : update.muxPlaybackUrl,
      transcriptBlobPathname:
        update.transcriptBlobPathname === undefined
          ? undefined
          : update.transcriptBlobPathname,
      lastErrorCode:
        update.lastErrorCode === undefined ? undefined : update.lastErrorCode,
      stageAttemptCounts:
        update.stageAttemptCounts === undefined
          ? undefined
          : update.stageAttemptCounts,
      assemblyAiCleanupStatus: update.assemblyAiCleanupStatus,
      sourceBlobCleanupStatus: update.sourceBlobCleanupStatus,
      reviewedSpeakerMapping:
        update.reviewedSpeakerMapping === undefined
          ? undefined
          : update.reviewedSpeakerMapping === null
            ? Prisma.DbNull
            : update.reviewedSpeakerMapping,
      reviewedBy:
        update.reviewedBy === undefined ? undefined : update.reviewedBy,
      reviewedAt:
        update.reviewedAt !== undefined
          ? update.reviewedAt
            ? new Date(update.reviewedAt)
            : null
          : undefined,
      deletionRequestedAt:
        update.deletionRequestedAt !== undefined
          ? update.deletionRequestedAt
            ? new Date(update.deletionRequestedAt)
            : null
          : undefined,
      deletionConfirmedAt:
        update.deletionConfirmedAt !== undefined
          ? update.deletionConfirmedAt
            ? new Date(update.deletionConfirmedAt)
            : null
          : undefined,
      deletionReason:
        update.deletionReason === undefined ? undefined : update.deletionReason,
    };

    const requestHash = createHash('sha256')
      .update(JSON.stringify(update))
      .digest('hex');
    type TransactionResult =
      | { kind: 'success'; data: unknown }
      | { kind: 'not_found' }
      | { kind: 'conflict'; message: string };

    const result: TransactionResult = await prisma.$transaction(async tx => {
      const idempotencyWhere = {
        bookingId_recordingId_idempotencyKey: {
          bookingId,
          recordingId,
          idempotencyKey,
        },
      };
      const priorRequest = await tx.seminarRecordingIdempotency.findUnique({
        where: idempotencyWhere,
      });
      if (priorRequest) {
        if (priorRequest.requestHash !== requestHash) {
          return {
            kind: 'conflict',
            message: 'Idempotency-Key was already used with a different body',
          };
        }
        return { kind: 'success', data: priorRequest.response };
      }

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, userId: true },
      });
      if (!booking) {
        return { kind: 'not_found' };
      }

      const existing = await tx.seminarRecordingWorkflow.findUnique({
        where: { bookingId_recordingId: { bookingId, recordingId } },
      });

      if (
        existing &&
        existing.status !== update.status &&
        !ALLOWED_TRANSITIONS[existing.status].includes(update.status)
      ) {
        return {
          kind: 'conflict',
          message: `Invalid state transition ${existing.status} -> ${update.status}`,
        };
      }
      if (!existing && update.status !== 'QUEUED') {
        return {
          kind: 'conflict',
          message: 'A new workflow must start in QUEUED status',
        };
      }

      let workflow: Awaited<
        ReturnType<typeof tx.seminarRecordingWorkflow.create>
      >;
      if (existing) {
        const updateResult = await tx.seminarRecordingWorkflow.updateMany({
          where: { id: existing.id, status: existing.status },
          data,
        });
        if (updateResult.count !== 1) {
          return {
            kind: 'conflict',
            message: 'Workflow status changed during update',
          };
        }
        workflow = await tx.seminarRecordingWorkflow.findUniqueOrThrow({
          where: { id: existing.id },
        });
      } else {
        workflow = await tx.seminarRecordingWorkflow.create({
          data: {
            bookingId,
            participantUserId: booking.userId,
            recordingId,
            ...data,
            queuedAt: update.queuedAt ? new Date(update.queuedAt) : new Date(),
          },
        });
      }

      if (!existing || existing.status !== workflow.status) {
        await tx.seminarRecordingTraceEvent.create({
          data: {
            workflowId: workflow.id,
            eventType: 'status_transition',
            fromStatus: existing?.status ?? null,
            toStatus: workflow.status,
            operatorId: update.reviewedBy ?? null,
            occurredAt: new Date(),
          },
        });
      }

      const purged =
        workflow.status === 'DELETED' && workflow.deletionConfirmedAt !== null;
      const responseData = purged
        ? { purged: true, recordingId }
        : serializeWorkflow(workflow);
      if (purged) {
        await tx.seminarRecordingWorkflow.delete({
          where: { id: workflow.id },
        });
      }

      await tx.seminarRecordingIdempotency.create({
        data: {
          bookingId,
          recordingId,
          idempotencyKey,
          requestHash,
          response: responseData,
        },
      });
      return { kind: 'success', data: responseData };
    });

    if (result.kind === 'not_found') {
      return await createServiceApiErrorResponse(
        'Booking not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }
    if (result.kind === 'conflict') {
      return await createServiceApiErrorResponse(
        result.message,
        ErrorCodes.CONFLICT,
        requestId,
        409
      );
    }
    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      result.data
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return await createServiceApiErrorResponse(
        'Workflow or idempotency key already exists',
        ErrorCodes.CONFLICT,
        requestId,
        409
      );
    }
    logger.error(
      'Workflow upsert failed',
      error instanceof Error ? error : new Error('unknown')
    );
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
