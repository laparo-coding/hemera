import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { logServiceApiCall } from '@/lib/monitoring/service-api-logger';
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
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/participations/${id}`
  );
  const logger = createApiLogger(context);
  const startTime = Date.now();

  try{
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthenticated request');
      return createServiceApiErrorResponse(
        'Not authenticated',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Role check
    const role = await getUserRole();
    if (role !== 'api-client' && role !== 'admin') {
      logger.warn('Forbidden: insufficient permissions', { userId, role });
      return createServiceApiErrorResponse(
        'Forbidden: api-client or admin role required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403,
        userId,
        role
      );
    }

    logger.info('Service API request authorized', {
      userId,
      role,
      participationId: id,
    });

    // Rate limiting check
    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded', { userId, role });
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
      logger.warn('Participation not found', { participationId: id });
      return createServiceApiErrorResponse(
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
      responseTime: Date.now() - startTime,
    });

    return createServiceApiSuccessResponse(requestId, userId, role, data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve participation', err);
    return createServiceApiErrorResponse(
      err.message,
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
