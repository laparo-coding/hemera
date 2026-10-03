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
import { Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  fromWireStatus,
  serializeWorkflow,
} from '@/lib/services/seminar-recording-workflow';
import { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';
import {
  createServiceApiErrorResponse,
  getServiceApiHeaders,
  handleOptionsRequest,
} from '@/lib/utils/service-api-response';

export const dynamic = 'force-dynamic';

// Wire-format enums per the OpenAPI contract (lowercase snake_case).
// Prisma values are converted at this boundary in both directions.
const WorkflowStatusSchema = z.enum([
  'queued',
  'transcribing',
  'transcript_ready',
  'review_required',
  'publishing',
  'ready',
  'retryable_failure',
  'failed',
  'deletion_pending',
  'deleted',
]);

const CleanupStatusSchema = z.enum([
  'pending',
  'complete',
  'retryable_failure',
  'not_required',
]);

const DeletionReasonSchema = z.enum([
  'booking_deleted',
  'participation_deleted',
  'operator_abandoned',
]);

const WIRE_TO_PRISMA_CLEANUP = {
  pending: 'PENDING',
  complete: 'COMPLETE',
  retryable_failure: 'RETRYABLE_FAILURE',
  not_required: 'NOT_REQUIRED',
} as const;

const WIRE_TO_PRISMA_DELETION_REASON = {
  booking_deleted: 'BOOKING_DELETED',
  participation_deleted: 'PARTICIPATION_DELETED',
  operator_abandoned: 'OPERATOR_ABANDONED',
} as const;

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
    durationSeconds: z.number().positive().nullish(),
    transcriptBlobPathname: z.string().nullish(),
    lastErrorCode: z.string().nullish(),
    stageAttemptCounts: z
      .record(z.string(), z.number().int().min(0).max(5))
      .optional(),
    nextAttemptAt: z.string().datetime().nullish(),
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

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
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
      where: {
        originalBookingId_recordingId: {
          originalBookingId: bookingId,
          recordingId,
        },
      },
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

    // Flat body per the OpenAPI contract: Aither parses the workflow
    // object at the top level, so no { success, data } envelope.
    return NextResponse.json(serializeWorkflow(workflow), {
      headers: await getServiceApiHeaders(requestId, userId, role),
    });
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

    // Convert wire-format enums to Prisma values at the API boundary.
    const prismaStatus = fromWireStatus(update.status);
    if (!prismaStatus) {
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
      status: prismaStatus,
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
      durationSeconds:
        update.durationSeconds === undefined
          ? undefined
          : update.durationSeconds,
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
      nextAttemptAt:
        update.nextAttemptAt !== undefined
          ? update.nextAttemptAt
            ? new Date(update.nextAttemptAt)
            : null
          : undefined,
      assemblyAiCleanupStatus:
        update.assemblyAiCleanupStatus === undefined
          ? undefined
          : WIRE_TO_PRISMA_CLEANUP[update.assemblyAiCleanupStatus],
      sourceBlobCleanupStatus:
        update.sourceBlobCleanupStatus === undefined
          ? undefined
          : WIRE_TO_PRISMA_CLEANUP[update.sourceBlobCleanupStatus],
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
        update.deletionReason === undefined
          ? undefined
          : update.deletionReason === null
            ? null
            : WIRE_TO_PRISMA_DELETION_REASON[update.deletionReason],
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

      const existing = await tx.seminarRecordingWorkflow.findUnique({
        where: {
          originalBookingId_recordingId: {
            originalBookingId: bookingId,
            recordingId,
          },
        },
      });

      // The booking is only required when creating a new workflow. Existing
      // workflows — including tombstones whose booking was deleted — stay
      // addressable so Aither can confirm the deletion and purge them.
      let participantUserId: string;
      if (existing) {
        participantUserId = existing.participantUserId;
      } else {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, userId: true },
        });
        if (!booking) {
          return { kind: 'not_found' };
        }
        participantUserId = booking.userId;
      }

      if (
        existing &&
        existing.status !== prismaStatus &&
        !(ALLOWED_TRANSITIONS[existing.status] ?? []).includes(prismaStatus)
      ) {
        return {
          kind: 'conflict',
          message: `Invalid state transition ${existing.status} -> ${prismaStatus}`,
        };
      }
      if (!existing && prismaStatus !== 'QUEUED') {
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
            originalBookingId: bookingId,
            participantUserId,
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
        // Full removal of workflow metadata: the workflow, its idempotency
        // records (which store complete workflow responses), and any
        // outstanding deletion outbox entry.
        await tx.seminarRecordingIdempotency.deleteMany({
          where: { bookingId, recordingId },
        });
        await tx.seminarRecordingDeletionOutbox.deleteMany({
          where: { bookingId, recordingId },
        });
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
    // Flat body per the OpenAPI contract: Aither parses the workflow
    // object at the top level, so no { success, data } envelope.
    return NextResponse.json(result.data, {
      headers: await getServiceApiHeaders(requestId, userId, role),
    });
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
