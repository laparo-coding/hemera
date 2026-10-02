/**
 * POST /api/service/seminar-document-access-proxy
 * Participant-facing proxy that hands out short-lived signed media links for a
 * ready seminar recording (Feature 012-video-transcription, FR-012).
 *
 * IDOR protection: the caller is identified ONLY by the Clerk session. The
 * `bookingId` and `recordingId` in the body are untrusted selectors. They are
 * resolved by a query scoped to the session user (workflow participant AND
 * booking owner), and only identifiers loaded from the database are forwarded
 * to Aither. Every miss (unknown, foreign, not ready, deleted, locked) returns
 * the same 404 so identifiers cannot be probed. API keys and admin/service
 * roles are deliberately not accepted: there is no booking owner to verify.
 * The Aither service key never leaves the server.
 */

import { auth } from '@clerk/nextjs/server';
import { SeminarRecordingWorkflowStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  AitherAccessError,
  requestSeminarDocumentAccess,
} from '@/lib/services/aither-seminar-access';
import { createApiLogger } from '@/lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import { shouldLockCourseStepsUntilSeminarStart } from '@/lib/utils/course-step-access';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';

const AccessRequestSchema = z
  .object({
    bookingId: z.string().min(1).max(128),
    recordingId: z.string().min(1).max(128),
  })
  .strict();

const NOT_FOUND_MESSAGE = 'Seminaraufnahme nicht gefunden';

function createAccessErrorResponse(
  error: AitherAccessError,
  requestId: string
) {
  switch (error.kind) {
    case 'not_found':
      return createErrorResponse(
        NOT_FOUND_MESSAGE,
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    case 'not_ready':
      return createErrorResponse(
        'Die Seminaraufnahme ist noch nicht verfügbar.',
        ErrorCodes.CONFLICT,
        requestId,
        409
      );
    case 'not_configured':
      return createErrorResponse(
        'Der Zugriff auf Seminaraufnahmen ist derzeit nicht verfügbar.',
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        requestId,
        503
      );
    default:
      return createErrorResponse(
        'Die Seminaraufnahme ist gerade nicht erreichbar. Bitte versuche es später erneut.',
        ErrorCodes.EXTERNAL_SERVICE_ERROR,
        requestId,
        502
      );
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const logger = createApiLogger(
    createRequestContext(
      requestId,
      'POST',
      '/api/service/seminar-document-access-proxy'
    )
  );

  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        'Authentifizierung erforderlich',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const rateLimitResponse = await checkRateLimit(userId, 'user', requestId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(
        'Ungültige Anfrage',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    const parsed = AccessRequestSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(
        'Ungültige Anfrage',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    // Ownership is part of the query itself, so a foreign booking is
    // indistinguishable from a missing one.
    const workflow = await prisma.seminarRecordingWorkflow.findFirst({
      where: {
        bookingId: parsed.data.bookingId,
        recordingId: parsed.data.recordingId,
        status: SeminarRecordingWorkflowStatus.READY,
        participantUserId: userId,
        booking: { userId },
      },
      select: {
        bookingId: true,
        recordingId: true,
        booking: { select: { course: { select: { startDate: true } } } },
      },
    });

    // Same lock as the Nachbereitung page: no access before the seminar starts.
    if (
      !workflow?.bookingId ||
      !workflow.booking ||
      shouldLockCourseStepsUntilSeminarStart(workflow.booking.course.startDate)
    ) {
      logger.warn('Seminar document access denied', {
        userId,
        bookingId: parsed.data.bookingId,
        recordingId: parsed.data.recordingId,
      });
      return createErrorResponse(
        NOT_FOUND_MESSAGE,
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    try {
      const access = await requestSeminarDocumentAccess({
        bookingId: workflow.bookingId,
        recordingId: workflow.recordingId,
      });
      const response = createSuccessResponse(access, requestId);
      // The payload contains bearer URLs; it must never be cached.
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (error) {
      if (!(error instanceof AitherAccessError)) {
        throw error;
      }

      const details = {
        kind: error.kind,
        upstreamStatus: error.upstreamStatus,
        reason: error.reason,
        bookingId: workflow.bookingId,
        recordingId: workflow.recordingId,
      };
      if (error.kind === 'not_found' || error.kind === 'not_ready') {
        logger.warn(
          'Aither rejected media access for a ready recording',
          details
        );
      } else {
        logger.error('Aither media access failed', error, details);
      }
      return createAccessErrorResponse(error, requestId);
    }
  } catch (error) {
    logger.error(
      'Seminar document access failed',
      error instanceof Error ? error : new Error('unknown')
    );
    return createErrorResponse(
      'Interner Serverfehler',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
