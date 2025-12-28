/**
 * Locations API Routes - GET all, POST create
 * Feature: 015-course-locations
 * Tasks: T025, T026
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/helpers';
import { locationCreateSchema } from '@/lib/schemas/location-schema';
import { createLocation, listLocations } from '@/lib/services/location';
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

/**
 * GET /api/locations - List all locations (public)
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'GET', '/api/locations');
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching all locations');

    const result = await listLocations();

    logger.info('Locations fetched successfully', { count: result.total });

    return createSuccessResponse(result, requestId);
  } catch (error) {
    logger.error(
      'Error fetching locations',
      error instanceof Error ? error : new Error(String(error))
    );
    return createErrorResponse(
      'Error loading locations',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * POST /api/locations - Create new location (admin only)
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'POST', '/api/locations');
  const logger = createApiLogger(context);

  try {
    // Check authentication
    const user = await currentUser();

    if (!user?.id) {
      logger.warn('Unauthorized attempt to create location');
      return createErrorResponse(
        'Authentication required',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Check admin role
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      logger.warn('Non-admin user attempted to create location', {
        userId: user.id,
      });
      return createErrorResponse(
        'Admin permission required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = locationCreateSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid location data', { errors: validation.error.issues });
      return createErrorResponse(
        'Invalid input data',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400,
        {
          validationErrors: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }
      );
    }

    logger.info('Creating location', { name: validation.data.name });

    const location = await createLocation(validation.data);

    logger.info('Location created successfully', {
      id: location.id,
      slug: location.slug,
    });

    return createSuccessResponse(location, requestId, 201);
  } catch (error) {
    logger.error(
      'Error creating location',
      error instanceof Error ? error : new Error(String(error))
    );
    return createErrorResponse(
      'Error creating location',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
