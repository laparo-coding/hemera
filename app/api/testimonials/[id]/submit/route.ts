/**
 * Testimonial Submit API Route
 * Feature: 017-testimonial-management
 *
 * POST /api/testimonials/[id]/submit - Submit testimonial for approval
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { submitTestimonialForApproval } from '@/lib/services/testimonial';
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
  params: Promise<{ id: string }>;
}

/**
 * POST /api/testimonials/[id]/submit
 * Submit a draft testimonial for admin approval
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'POST',
    `/api/testimonials/${id}/submit`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Submitting testimonial for approval', { testimonialId: id });

    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        'Nicht authentifiziert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const testimonial = await submitTestimonialForApproval(id, userId);

    logger.info('Successfully submitted testimonial for approval', {
      testimonialId: id,
    });

    return createSuccessResponse(
      {
        ...testimonial,
        message: 'Dein Erfahrungsbericht wurde zur Freigabe eingereicht',
      },
      requestId
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    logger.error('Failed to submit testimonial', error instanceof Error ? error : undefined);

    // Handle known business errors
    if (errorMessage.includes('nicht gefunden')) {
      return createErrorResponse(
        errorMessage,
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    if (errorMessage.includes('keine Berechtigung')) {
      return createErrorResponse(
        errorMessage,
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    if (errorMessage.includes('Nur Entwürfe')) {
      return createErrorResponse(
        errorMessage,
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    return createErrorResponse(
      'Fehler beim Einreichen des Erfahrungsberichts',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
