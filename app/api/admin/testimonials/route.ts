/**
 * Admin Testimonials API Routes
 * Feature: 017-testimonial-management
 *
 * GET /api/admin/testimonials - List testimonials with filters
 */

import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { testimonialFilterSchema } from '@/lib/schemas/testimonial-schema';
import { getTestimonialsForAdmin } from '@/lib/services/testimonial';
import {
  type AdminTestimonialsListResponse,
  toTestimonialWithCourseApiResponse,
} from '@/lib/types/testimonial';
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

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/testimonials
 * List all testimonials with optional filtering
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    '/api/admin/testimonials'
  );
  const logger = createApiLogger(context);

  try {
    // Check admin authorization and get admin ID for audit trail
    let adminId: string;
    try {
      adminId = await requireAdmin();
    } catch {
      return createErrorResponse(
        'Keine Admin-Berechtigung',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    logger.info('Admin fetching testimonials', { adminId });

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate and parse filters
    const parseResult = testimonialFilterSchema.safeParse(queryParams);
    if (!parseResult.success) {
      logger.warn('Invalid filter parameters', {
        validationErrors: parseResult.error.issues,
      });
      return createErrorResponse(
        parseResult.error.issues[0]?.message || 'Ungültige Filter',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    const { testimonials, total } = await getTestimonialsForAdmin({
      status: parseResult.data.status,
      courseId: parseResult.data.courseId,
      limit: parseResult.data.limit,
      offset: parseResult.data.offset,
    });

    logger.info('Successfully fetched admin testimonials', {
      count: testimonials.length,
      total,
    });

    // Transform to typed API response with serialized dates
    const responseData: AdminTestimonialsListResponse = {
      testimonials: testimonials.map(toTestimonialWithCourseApiResponse),
      pagination: {
        total,
        limit: parseResult.data.limit,
        offset: parseResult.data.offset,
      },
    };

    return createSuccessResponse(responseData, requestId);
  } catch (error) {
    logger.error(
      'Failed to fetch admin testimonials',
      error instanceof Error ? error : undefined
    );
    return createErrorResponse(
      'Fehler beim Laden der Erfahrungsberichte',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
