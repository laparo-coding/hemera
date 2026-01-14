/**
 * Admin Testimonials API Routes
 * Feature: 017-testimonial-management
 *
 * GET /api/admin/testimonials - List testimonials with filters
 */

import type { NextRequest } from 'next/server';
import { getTestimonialsForAdmin } from '@/lib/services/testimonial';
import { testimonialFilterSchema } from '@/lib/schemas/testimonial-schema';
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
    logger.info('Admin fetching testimonials');

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

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate and parse filters
    const parseResult = testimonialFilterSchema.safeParse(queryParams);
    if (!parseResult.success) {
      logger.warn('Invalid filter parameters', { issues: parseResult.error.issues });
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

    return createSuccessResponse(
      {
        testimonials,
        pagination: {
          total,
          limit: parseResult.data.limit,
          offset: parseResult.data.offset,
        },
      },
      requestId
    );
  } catch (error) {
    logger.error('Failed to fetch admin testimonials', error instanceof Error ? error : undefined);
    return createErrorResponse(
      'Fehler beim Laden der Erfahrungsberichte',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
