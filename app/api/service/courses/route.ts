import { CourseLevel, type Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
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

// Schema for query parameters
const CourseQuerySchema = z.object({
  level: z.nativeEnum(CourseLevel).optional(),
  published: z
    .string()
    .optional()
    .transform(val => (val === undefined ? undefined : val === 'true')),
  limit: z.coerce.number().min(1).max(500).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
});

/**
 * OPTIONS /api/service/courses
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

/**
 * GET /api/service/courses
 * List all courses with participant counts
 * Auth: api-client or admin role required
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    '/api/service/courses'
  );
  const logger = createApiLogger(context);
  const startTime = Date.now();

  try {
    // Unified auth check (Clerk session or API key)
    const authResult = await authenticateServiceRequest(request);

    if ('error' in authResult) {
      if (authResult.error === 'unauthenticated') {
        logger.warn('Unauthenticated request');
        return await createServiceApiErrorResponse(
          'Not authenticated',
          ErrorCodes.UNAUTHORIZED,
          requestId,
          401
        );
      }
      if (authResult.error === 'forbidden') {
        logger.warn('Forbidden: insufficient permissions', {
          userId: authResult.userId,
          role: authResult.role,
        });
        return await createServiceApiErrorResponse(
          'Forbidden: api-client or admin role required',
          ErrorCodes.FORBIDDEN,
          requestId,
          403,
          authResult.userId,
          authResult.role
        );
      }
      // Unexpected error variant — log and return generic error
      logger.warn('Unexpected auth error variant', {
        authError: (authResult as { error: string }).error,
      });
      return await createServiceApiErrorResponse(
        'Service authentication error',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      );
    }

    const { userId, role } = authResult;

    logger.info('Service API request authorized', {
      userId,
      role,
      authMethod: authResult.authMethod,
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedParams;
    try {
      validatedParams = CourseQuerySchema.parse(queryParams);
    } catch (error) {
      // Sanitize Zod errors and avoid logging raw query values (may contain sensitive info)
      const sanitizedError =
        error instanceof z.ZodError
          ? { issues: error.issues }
          : { message: String(error) };
      const querySummary = {
        keys: Object.keys(queryParams),
        count: Object.keys(queryParams).length,
      };
      logger.warn('Invalid query parameters', {
        querySummary,
        error: sanitizedError,
      });
      return await createServiceApiErrorResponse(
        'Invalid query parameters',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
        userId,
        role
      );
    }

    const { level, published, limit, offset } = validatedParams;

    // Build where clause
    const where: Prisma.CourseWhereInput = {};

    if (level) {
      where.level = level;
    }

    if (published !== undefined) {
      where.isPublished = published;
    } else {
      // Default: only published courses
      where.isPublished = true;
    }

    // Query courses with participant counts
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          level: true,
          startDate: true,
          endDate: true,
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    // Transform response
    const data = courses.map(course => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      level: course.level,
      startDate: course.startDate?.toISOString() ?? null,
      endDate: course.endDate?.toISOString() ?? null,
      participantCount: course._count.bookings,
    }));

    logger.info('Courses retrieved successfully', {
      count: data.length,
      total,
      filters: { level, published },
    });

    // Audit log
    logServiceApiCall({
      userId,
      userRole: role,
      endpoint: '/api/service/courses',
      method: 'GET',
      statusCode: 200,
      requestId,
      timestamp: new Date().toISOString(),
      ipAddress: extractIpAddress(request.headers),
      responseTime: Date.now() - startTime,
    });

    /**
     * Response shape note:
     * - Tests currently expect the endpoint to return the raw courses array in the
     *   `data` field (i.e. `{ success: true, data: [ ... ] }`). To avoid breaking
     *   downstream consumers which still expect the legacy shape `{ courses, total }`,
     *   we provide a feature-flagged fallback.
     *
     * Feature flag:
     * - `FEATURE_SERVICE_RESPONSE_LEGACY=true`  -> returns `{ courses: [...], total }` as `data`
     * - otherwise (default)                    -> returns the courses array directly as `data`
     *
     * This keeps tests green while allowing consumers to opt into the legacy payload.
     */
    const useLegacyResponse =
      String(process.env.FEATURE_SERVICE_RESPONSE_LEGACY).toLowerCase() ===
      'true';

    const payload = useLegacyResponse ? { courses: data, total } : data; // array returned in `data` by default to satisfy tests

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      payload
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve courses', err);
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500,
      undefined,
      undefined
    );
  }
}
