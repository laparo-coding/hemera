/**
 * Location by Slug API Route - GET location by slug
 * Feature: 015-course-locations
 * Task: T031
 */

import type { NextRequest } from 'next/server';
import { getLocationBySlug } from '@/lib/services/location';
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

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/locations/by-slug/[slug] - Get location by slug (public)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/locations/by-slug/${slug}`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching location by slug', { slug });

    const location = await getLocationBySlug(slug);

    if (!location) {
      logger.warn('Location not found', { slug });
      return createErrorResponse(
        'Location nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    logger.info('Location fetched successfully', { id: location.id, slug });

    return createSuccessResponse(location, requestId);
  } catch (error) {
    logger.error(
      'Error fetching location by slug',
      error instanceof Error ? error : new Error(String(error)),
      { slug }
    );
    return createErrorResponse(
      'Fehler beim Laden der Location',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
