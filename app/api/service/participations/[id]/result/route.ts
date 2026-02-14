import { auth } from '@clerk/nextjs/server';
import { ParticipationStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
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

// Schema for request body
const UpdateResultSchema = z.object({
  resultOutcome: z.string().max(2000).optional(),
  resultNotes: z.string().max(2000).optional(),
  complete: z.boolean().optional(),
});

/**
 * OPTIONS /api/service/participations/[id]/result
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

/**
 * PUT /api/service/participations/[id]/result
 * Update participation result data
 * Auth: api-client or admin role required
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'PUT',
    `/api/service/participations/${id}/result`
  );
  const logger = createApiLogger(context);
  const startTime = Date.now();

  try {
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn('Invalid JSON body', { error });
      return createServiceApiErrorResponse(
        'Invalid JSON body',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400,
        userId,
        role
      );
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = UpdateResultSchema.parse(body);
    } catch (error) {
      logger.warn('Invalid request body', { body, error });
      return createServiceApiErrorResponse(
        'Invalid request body',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
        userId,
        role
      );
    }

    // Check if participation exists
    const participation = await prisma.courseParticipation.findUnique({
      where: { id },
      select: { id: true, status: true },
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

    // Build update data
    const updateData: {
      resultOutcome?: string;
      resultNotes?: string;
      status?: ParticipationStatus;
      resultCompletedAt?: Date;
    } = {};

    if (validatedData.resultOutcome !== undefined) {
      updateData.resultOutcome = validatedData.resultOutcome;
    }

    if (validatedData.resultNotes !== undefined) {
      updateData.resultNotes = validatedData.resultNotes;
    }

    if (validatedData.complete === true) {
      updateData.status = ParticipationStatus.COMPLETE;
      updateData.resultCompletedAt = new Date();
    }

    // Update participation
    await prisma.courseParticipation.update({
      where: { id },
      data: updateData,
    });

    logger.info('Participation result updated successfully', {
      participationId: id,
      complete: validatedData.complete,
      hasOutcome: !!validatedData.resultOutcome,
      hasNotes: !!validatedData.resultNotes,
    });

    // Audit log
    logServiceApiCall({
      userId,
      userRole: role,
      endpoint: `/api/service/participations/${id}/result`,
      method: 'PUT',
      statusCode: 200,
      requestId,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });

    return createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      undefined,
      'Participation result updated successfully'
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update participation result', err);
    return createServiceApiErrorResponse(
      err.message,
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
