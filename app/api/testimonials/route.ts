/**
 * Testimonials API Routes (User)
 * Feature: 017-testimonial-management
 *
 * GET /api/testimonials - Get user's testimonials
 * POST /api/testimonials - Create a new testimonial
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { createTestimonialSchema } from '@/lib/schemas/testimonial-schema';
import {
  createTestimonial,
  getTestimonialsByUserId,
} from '@/lib/services/testimonial';
import {
  toTestimonialApiResponse,
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
 * GET /api/testimonials
 * Get all testimonials for the authenticated user
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'GET', '/api/testimonials');
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching user testimonials');

    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        'Nicht authentifiziert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const testimonials = await getTestimonialsByUserId(userId);

    logger.info('Successfully fetched user testimonials', {
      count: testimonials.length,
    });

    // Transform to typed API response with serialized dates
    return createSuccessResponse(
      testimonials.map(toTestimonialWithCourseApiResponse),
      requestId
    );
  } catch (error) {
    logger.error(
      'Failed to fetch testimonials',
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
 * POST /api/testimonials
 * Create a new testimonial for a booking
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'POST', '/api/testimonials');
  const logger = createApiLogger(context);

  try {
    logger.info('Creating new testimonial');

    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(
        'Nicht authentifiziert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Get user profile from Clerk
    const user = await currentUser();
    if (!user) {
      return createErrorResponse(
        'Benutzer nicht gefunden',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = createTestimonialSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn('Invalid testimonial input', { errors: parseResult.error });
      return createErrorResponse(
        parseResult.error.issues[0]?.message || 'Ungültige Eingabe',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    // Extract user profile data
    const userProfile = {
      firstName: user.firstName || 'Teilnehmer',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || null,
      // City might be in publicMetadata or unsafeMetadata
      city: (user.publicMetadata?.city as string) || null,
    };

    const testimonial = await createTestimonial(parseResult.data, userProfile);

    logger.info('Successfully created testimonial', {
      testimonialId: testimonial.id,
    });

    // Transform to typed API response with serialized dates
    return createSuccessResponse(
      toTestimonialApiResponse(testimonial),
      requestId,
      201
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    logger.error(
      'Failed to create testimonial',
      error instanceof Error ? error : undefined
    );

    // Handle known business errors
    if (
      errorMessage.includes('nicht gefunden') ||
      errorMessage.includes('bereits')
    ) {
      return createErrorResponse(
        errorMessage,
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    return createErrorResponse(
      'Fehler beim Erstellen des Erfahrungsberichts',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
