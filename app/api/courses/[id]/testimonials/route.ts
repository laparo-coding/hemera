/**
 * Public Course Testimonials API Route
 * Feature: 017-testimonial-management
 *
 * GET /api/courses/[id]/testimonials - Get published testimonials for a course
 * POST /api/courses/[id]/testimonials - Submit a testimonial (authenticated users)
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { syncUserFromClerk } from '@/lib/api/users';
import { prisma } from '@/lib/db/prisma';
import {
  createTestimonial,
  getPublishedTestimonialsForCourse,
} from '@/lib/services/testimonial';
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

    // Find course by ID or slug in a single query
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!course) {
      return createErrorResponse(
        'Kurs nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    // Get limit from query params with validation
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 10;

    // Validate limit: must be a positive number, max 50
    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      return createErrorResponse(
        'Ungültiger "limit" Parameter. Muss eine positive Zahl sein.',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    const limit = Math.min(parsedLimit, 50);

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

/**
 * POST /api/courses/[id]/testimonials
 * Submit a testimonial for a course (authenticated users only)
 * Uses synced DB user ID for consistent entity relationships
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'POST',
    `/api/courses/${id}/testimonials`
  );
  const logger = createApiLogger(context);

  try {
    // Authenticate user
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return createErrorResponse(
        'Anmeldung erforderlich',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Sync user to database and get DB user ID for consistent entity relationships
    // This ensures testimonials are linked using DB IDs (not Clerk IDs)
    const dbUser = await syncUserFromClerk(clerkUser);

    logger.info('User submitting testimonial', {
      clerkUserId: clerkUser.id,
      dbUserId: dbUser.id,
      courseIdOrSlug: id,
    });

    // Find course by ID or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, title: true },
    });

    if (!course) {
      return createErrorResponse(
        'Kurs nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { content, rating } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return createErrorResponse(
        'Erfahrungsbericht muss mindestens 10 Zeichen enthalten',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return createErrorResponse(
        'Bewertung muss zwischen 1 und 5 liegen',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    // Create testimonial using DB user ID
    const testimonial = await createTestimonial({
      courseId: course.id,
      userId: dbUser.id, // Use synced DB user ID, not Clerk ID
      authorName:
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        'Anonym',
      authorRole: undefined,
      authorImage: clerkUser.imageUrl,
      content: content.trim(),
      rating,
      isPublished: false, // Requires admin approval
    });

    logger.info('Successfully created testimonial', {
      testimonialId: testimonial.id,
      courseId: course.id,
      dbUserId: dbUser.id,
    });

    return createSuccessResponse(
      {
        message:
          'Erfahrungsbericht eingereicht. Wird nach Prüfung veröffentlicht.',
        testimonialId: testimonial.id,
      },
      requestId,
      201
    );
  } catch (error) {
    logger.error(
      'Failed to create testimonial',
      error instanceof Error ? error : undefined
    );
    return createErrorResponse(
      'Fehler beim Einreichen des Erfahrungsberichts',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
