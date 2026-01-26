/**
 * Booking Testimonial API Route
 * Feature: 017-testimonial-management
 *
 * GET /api/bookings/[bookingId]/testimonial - Get testimonial for a booking
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createApiLogger } from '@/lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

/**
 * GET /api/bookings/[bookingId]/testimonial
 * Get the testimonial for a specific booking (auth required)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { bookingId } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/bookings/${bookingId}/testimonial`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching testimonial for booking', { bookingId });

    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        'Nicht authentifiziert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Verify booking ownership
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      select: {
        id: true,
        testimonial: {
          select: {
            id: true,
            statement: true,
            nameDisplayFormat: true,
            cachedDisplayName: true,
            cachedPhotoUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!booking) {
      return createErrorResponse(
        'Buchung nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    if (!booking.testimonial) {
      return createErrorResponse(
        'Kein Erfahrungsbericht vorhanden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    logger.info('Successfully fetched testimonial for booking', {
      bookingId,
      testimonialId: booking.testimonial.id,
    });

    return createSuccessResponse(booking.testimonial, requestId);
  } catch (error) {
    logger.error(
      'Failed to fetch testimonial for booking',
      error instanceof Error ? error : undefined
    );
    return createErrorResponse(
      'Fehler beim Laden des Erfahrungsberichts',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
