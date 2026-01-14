/**
 * Admin Single Testimonial API Routes
 * Feature: 017-testimonial-management
 *
 * PATCH /api/admin/testimonials/[id] - Update testimonial status
 */

import type { NextRequest } from 'next/server';
import { updateTestimonialStatus } from '@/lib/services/testimonial';
import { adminUpdateTestimonialSchema } from '@/lib/schemas/testimonial-schema';
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
import { requireAdmin } from '@/lib/auth/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/testimonials/[id]
 * Update testimonial status (approve/hide)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'PATCH',
    `/api/admin/testimonials/${id}`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Admin updating testimonial status', { testimonialId: id });

    // Check admin authorization - throws if not admin
    try {
      await requireAdmin();
    } catch {
      return createErrorResponse(
        'Keine Admin-Berechtigung',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = adminUpdateTestimonialSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn('Invalid status update input', { issues: parseResult.error.issues });
      return createErrorResponse(
        parseResult.error.issues[0]?.message || 'Ungültige Eingabe',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    const testimonial = await updateTestimonialStatus(
      id,
      parseResult.data.status
    );

    logger.info('Successfully updated testimonial status', {
      testimonialId: id,
      newStatus: parseResult.data.status,
    });

    return createSuccessResponse(testimonial, requestId);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    logger.error('Failed to update testimonial status', error instanceof Error ? error : undefined);

    if (errorMessage.includes('nicht gefunden')) {
      return createErrorResponse(
        errorMessage,
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    return createErrorResponse(
      'Fehler beim Aktualisieren des Status',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
