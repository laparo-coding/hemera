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

const IdParamSchema = z.string().cuid('Invalid participation ID format');

/**
 * OPTIONS /api/service/participations/[id]
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

/**
 * GET /api/service/participations/[id]
 * Get participation details
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
      'Invalid participation ID format',
      ErrorCodes.VALIDATION_ERROR,
      requestId,
      400
    );
  }
  const id = idResult.data;

  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/participations/${id}`
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
      participationId: id,
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

    // Query participation
    const participation = await prisma.courseParticipation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        preparationIntent: true,
        desiredResults: true,
        resultOutcome: true,
        resultNotes: true,
        resultCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!participation) {
      logger.warn('Participation not found', {
        participationId: id,
      });
      return await createServiceApiErrorResponse(
        'Participation not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }

    // Transform response
    const data = {
      id: participation.id,
      userId: participation.userId,
      courseId: participation.courseId,
      status: participation.status,
      preparationIntent: participation.preparationIntent,
      desiredResults: participation.desiredResults,
      resultOutcome: participation.resultOutcome,
      resultNotes: participation.resultNotes,
      resultCompletedAt: participation.resultCompletedAt?.toISOString() ?? null,
      createdAt: participation.createdAt.toISOString(),
      updatedAt: participation.updatedAt.toISOString(),
    };

    logger.info('Participation retrieved successfully', {
      participationId: id,
      status: data.status,
    });

    // Audit log
    logServiceApiCall({
      userId,
      userRole: role,
      endpoint: `/api/service/participations/${id}`,
      method: 'GET',
      statusCode: 200,
      requestId,
      timestamp: new Date().toISOString(),
      ipAddress: extractIpAddress(request.headers),
      responseTime: Date.now() - startTime,
    });

    /**
     * Response shape note:
     * - Default: return the participation object directly in `data`.
     * - Legacy fallback: when `FEATURE_SERVICE_RESPONSE_LEGACY=true` return
     *   `{ participation: { ... } }` as `data` to support older consumers.
     */
    const useLegacyResponse =
      String(process.env.FEATURE_SERVICE_RESPONSE_LEGACY).toLowerCase() ===
      'true';

    const payload = useLegacyResponse ? { participation: data } : data;

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      payload
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve participation', err);
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
