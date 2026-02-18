import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  extractIpAddress,
  logServiceApiCall,
} from '@/lib/monitoring/service-api-logger';
import { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';
import {
  createServiceApiErrorResponse,
  createServiceApiSuccessResponse,
  handleOptionsRequest,
} from '@/lib/utils/service-api-response';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const IdParamSchema = z.string().cuid('Invalid course ID format');

/**
 * OPTIONS /api/service/courses/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

/**
 * GET /api/service/courses/[id]
 * Get course details with participations
 * Auth: api-client or admin role required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const requestId = getOrCreateRequestId(request);

  // Validate ID format
  const idResult = IdParamSchema.safeParse(rawId);
  if (!idResult.success) {
    return await createServiceApiErrorResponse(
      'Invalid course ID format',
      ErrorCodes.VALIDATION_ERROR,
      requestId,
      400
    );
  }
  const id = idResult.data;

  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/courses/${id}`
  );
  const logger = createApiLogger(context);
  const startTime = Date.now();

  try {
    // Unified auth check (Clerk session or API key)
    const authResult = await authenticateServiceRequest(request);

    if ('error' in authResult) {
      return handleServiceAuthError(authResult, logger, requestId);
    }

    const { userId, role, authMethod } = authResult;

    logger.info('Service API request authorized', {
      userId,
      role,
      authMethod,
      courseId: id,
    });

    // Rate limiting check
    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded', {
        userId,
        role,
      });
      return rateLimitResponse;
    }

    // Query course with participations
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        startDate: true,
        endDate: true,
        bookings: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
            participation: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      logger.warn('Course not found', {
        courseId: id,
      });
      return await createServiceApiErrorResponse(
        'Course not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }

    // Transform response
    const data = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      level: course.level,
      startDate: course.startDate?.toISOString() ?? null,
      endDate: course.endDate?.toISOString() ?? null,
      participations: course.bookings.map(booking => ({
        id: booking.participation?.id ?? null,
        userId: booking.userId,
        status: booking.participation?.status ?? null,
        createdAt: booking.createdAt.toISOString(),
      })),
    };

    logger.info('Course retrieved successfully', {
      courseId: id,
      participationCount: data.participations.length,
    });

    // Audit log
    logServiceApiCall({
      userId,
      userRole: role,
      endpoint: `/api/service/courses/${id}`,
      method: 'GET',
      statusCode: 200,
      requestId,
      timestamp: new Date().toISOString(),
      ipAddress: extractIpAddress(request.headers),
      responseTime: Date.now() - startTime,
    });

    /**
     * Response shape note:
     * - Default: return the course object directly in `data` to satisfy tests and
     *   standard consumers (`data: { ... }`).
     * - Legacy fallback: some downstream consumers expect a wrapped shape
     *   (e.g. `{ course: { ... } }`). To avoid breaking them, support the
     *   feature flag `FEATURE_SERVICE_RESPONSE_LEGACY=true` which returns that
     *   wrapped shape as `data`.
     */
    const useLegacyResponse =
      String(process.env.FEATURE_SERVICE_RESPONSE_LEGACY).toLowerCase() ===
      'true';

    const payload = useLegacyResponse ? { course: data } : data;

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      payload
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve course', err);
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
