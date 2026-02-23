import { ParticipationStatus } from '@prisma/client';
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

// Schema for request body
const UpdateResultSchema = z
  .object({
    resultOutcome: z.string().max(2000).optional(),
    resultNotes: z.string().max(2000).optional(),
    complete: z.boolean().optional(),
  })
  .refine(
    data =>
      data.resultOutcome !== undefined ||
      data.resultNotes !== undefined ||
      data.complete !== undefined,
    {
      message:
        'At least one field (resultOutcome, resultNotes, complete) must be provided',
    }
  );

const IdParamSchema = z.string().cuid('Invalid participation ID format');

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
    'PUT',
    `/api/service/participations/${id}/result`
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.warn('Invalid JSON body', {
        errorMessage,
        errorStack,
      });
      return await createServiceApiErrorResponse(
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
      // Avoid logging full request body (may contain PII). Log a summary and sanitized error info.
      const logError =
        error instanceof z.ZodError
          ? { issues: error.issues }
          : { message: String(error) };
      const bodySummary = {
        keys: body && typeof body === 'object' ? Object.keys(body) : [],
        keyCount:
          body && typeof body === 'object' ? Object.keys(body).length : 0,
      };
      logger.warn('Invalid request body', {
        bodySummary,
        error: logError,
      });
      return await createServiceApiErrorResponse(
        'Invalid request body',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400,
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

    // Atomic check-and-update to avoid TOCTOU race condition
    const updated = await prisma.$transaction(async tx => {
      const participation = await tx.courseParticipation.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!participation) {
        return null;
      }

      return await tx.courseParticipation.update({
        where: { id },
        data: updateData,
      });
    });

    if (!updated) {
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
      ipAddress: extractIpAddress(request.headers),
      responseTime: Date.now() - startTime,
    });

    /**
     * Response shape note:
     * - Default: return no `data`, but include a success `message`.
     * - Legacy fallback: some consumers expect the message inside `data`.
     *   When `FEATURE_SERVICE_RESPONSE_LEGACY=true` return `{ message }` as `data`
     *   instead of using the `message` field.
     */
    const useLegacyResponse =
      String(process.env.FEATURE_SERVICE_RESPONSE_LEGACY).toLowerCase() ===
      'true';

    const legacyPayload = {
      message: 'Participation result updated successfully',
    };

    if (useLegacyResponse) {
      return await createServiceApiSuccessResponse(
        requestId,
        userId,
        role,
        legacyPayload
      );
    }

    return await createServiceApiSuccessResponse(
      requestId,
      userId,
      role,
      undefined,
      'Participation result updated successfully'
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update participation result', err);
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
