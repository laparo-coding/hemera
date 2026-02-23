/**
 * Location API Routes - GET one, PUT update, DELETE
 * Feature: 015-course-locations
 * Tasks: T027, T028, T029
 */

import type { NextRequest } from 'next/server';
import { checkUserAdminStatus, getCurrentUser } from '@/lib/auth/helpers';
import { locationUpdateSchema } from '@/lib/schemas/location-schema';
import {
  deleteLocation,
  getLocationById,
  updateLocation,
} from '@/lib/services/location';
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
  params: Promise<{ id: string }>;
}

/**
 * GET /api/locations/[id] - Get single location (public)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/locations/${id}`
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Fetching location by ID', { id });

    const location = await getLocationById(id);

    if (!location) {
      logger.warn('Location not found', { id });
      return createErrorResponse(
        'Location not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    logger.info('Location fetched successfully', { id, slug: location.slug });

    return createSuccessResponse(location, requestId);
  } catch (error) {
    logger.error(
      'Error fetching location',
      error instanceof Error ? error : new Error(String(error)),
      { id }
    );
    return createErrorResponse(
      'Error loading location',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * PUT /api/locations/[id] - Update location (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'PUT',
    `/api/locations/${id}`
  );
  const logger = createApiLogger(context);

  try {
    // Check authentication — single Clerk call
    const user = await getCurrentUser();
    const userId = user?.id ?? null;

    if (!userId) {
      logger.warn('Unauthorized attempt to update location');
      return createErrorResponse(
        'Authentication required',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Check admin role
    const isAdmin = await checkUserAdminStatus(user);
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to update location', {
        userId,
        locationId: id,
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
    const validation = locationUpdateSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid location update data', {
        errors: validation.error.issues,
      });
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

    logger.info('Updating location', { id });

    const location = await updateLocation(id, validation.data);

    logger.info('Location updated successfully', { id, slug: location.slug });

    return createSuccessResponse(location, requestId);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Location not found') {
      logger.warn('Location not found for update', { id });
      return createErrorResponse(
        'Location not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    logger.error(
      'Error updating location',
      error instanceof Error ? error : new Error(String(error)),
      { id }
    );
    return createErrorResponse(
      'Error updating location',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * DELETE /api/locations/[id] - Delete location (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'DELETE',
    `/api/locations/${id}`
  );
  const logger = createApiLogger(context);

  try {
    // Check authentication — single Clerk call
    const user = await getCurrentUser();
    const userId = user?.id ?? null;

    if (!userId) {
      logger.warn('Unauthorized attempt to delete location');
      return createErrorResponse(
        'Authentication required',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Check admin role
    const isAdmin = await checkUserAdminStatus(user);
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to delete location', {
        userId,
        locationId: id,
      });
      return createErrorResponse(
        'Admin permission required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    logger.info('Deleting location', { id });

    const result = await deleteLocation(id);

    // Check if deletion was blocked due to references
    if (
      result &&
      'code' in result &&
      result.code === 'LOCATION_HAS_REFERENCES'
    ) {
      logger.warn('Location deletion blocked - has course references', {
        id,
        courseCount: result.referencingCourses.length,
      });
      return Response.json(
        {
          error: result.error,
          code: result.code,
          referencingCourses: result.referencingCourses,
          requestId,
        },
        { status: 409 }
      );
    }

    logger.info('Location deleted successfully', { id });

    return new Response(null, { status: 204 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'Location not found') {
      logger.warn('Location not found for deletion', { id });
      return createErrorResponse(
        'Location not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
    }

    logger.error(
      'Error deleting location',
      error instanceof Error ? error : new Error(String(error)),
      { id }
    );
    return createErrorResponse(
      'Error deleting location',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
