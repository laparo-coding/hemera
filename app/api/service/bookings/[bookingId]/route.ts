/**
 * GET /api/service/bookings/[bookingId]
 * Resolve a booking before recording (Feature 012-video-transcription)
 *
 * Returns the booking with the server-derived participant identity.
 * The participantUserId is derived from the booking — never from caller input.
 * Auth: service API key (X-API-Key) or Clerk session (api-client/admin role)
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
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

const BookingContextSchema = z.object({
  bookingId: z.string().min(1),
  participantUserId: z.string().min(1),
  courseId: z.string().min(1),
});

export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { bookingId } = await params;
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/bookings/${bookingId}`
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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        courseId: true,
      },
    });

    if (!booking) {
      return await createServiceApiErrorResponse(
        'Booking not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }

    // Server-derived participant identity — never trust caller input
    const bookingContext = BookingContextSchema.parse({
      bookingId: booking.id,
      participantUserId: booking.userId,
      courseId: booking.courseId,
    });

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      bookingContext
    );
  } catch (error) {
    logger.error(
      'Booking lookup failed',
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
