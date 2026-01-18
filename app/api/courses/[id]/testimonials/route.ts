/**
 * Public Course Testimonials API Route
 * Feature: 017-testimonial-management
 *
 * GET /api/courses/[id]/testimonials - Get published testimonials for a course
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPublishedTestimonialsForCourse } from '@/lib/services/testimonial';
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
 * GET /api/courses/[id]/testimonials
 * Get published testimonials for a course (public)
 * Accepts either course ID (cuid) or slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/courses/${id}/testimonials`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching course testimonials', { courseIdOrSlug: id });

    // Try to find course by ID first, then by slug
    let course = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!course) {
      // Try by slug
      course = await prisma.course.findUnique({
        where: { slug: id },
        select: { id: true },
      });
    }

    if (!course) {
      return createErrorResponse(
        'Kurs nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') || '10', 10),
      50
    );

    const testimonials = await getPublishedTestimonialsForCourse(
      course.id,
      limit
    );

    logger.info('Successfully fetched course testimonials', {
      courseId: course.id,
      count: testimonials.length,
    });

    return createSuccessResponse(testimonials, requestId);
  } catch (error) {
    logger.error(
      'Failed to fetch course testimonials',
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
