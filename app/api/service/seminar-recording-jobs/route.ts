/**
 * GET /api/service/seminar-recording-jobs
 * List queued or resumable workflows for the Aither worker
 * (Feature 012-video-transcription)
 *
 * Returns workflows ordered by creation time, oldest first.
 * Auth: service API key (X-API-Key) or Clerk session (api-client/admin role)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  fromWireStatus,
  serializeWorkflow,
} from '@/lib/services/seminar-recording-workflow';
import { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';
import {
  createServiceApiErrorResponse,
  getServiceApiHeaders,
  handleOptionsRequest,
} from '@/lib/utils/service-api-response';

export const dynamic = 'force-dynamic';

// Wire-format statuses per the OpenAPI contract (lowercase snake_case).
const WireStatusSchema = z.enum([
  'queued',
  'transcribing',
  'transcript_ready',
  'review_required',
  'publishing',
  'ready',
  'retryable_failure',
  'failed',
  'deletion_pending',
  'deleted',
]);

const JobQuerySchema = z.object({
  status: z
    .string()
    .min(1)
    .transform(val => val.split(',').map(s => s.trim()))
    .pipe(z.array(WireStatusSchema).min(1)),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    '/api/service/seminar-recording-jobs'
  );
  const logger = createApiLogger(context);

  try {
    const authResult = await authenticateServiceRequest(request);
    if ('error' in authResult) {
      return await handleServiceAuthError(authResult, logger, requestId);
    }
    const { userId, role } = authResult;

    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validated;
    try {
      validated = JobQuerySchema.parse(queryParams);
    } catch (error) {
      logger.warn('Invalid job query parameters', {
        keys: Object.keys(queryParams),
        issues: error instanceof z.ZodError ? error.issues.length : 'unknown',
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

    // Convert wire statuses to Prisma enum values for the database query.
    const prismaStatuses = validated.status
      .map(fromWireStatus)
      .filter((status): status is NonNullable<typeof status> => !!status);

    const workflows = await prisma.seminarRecordingWorkflow.findMany({
      where: { status: { in: prismaStatuses } },
      orderBy: { queuedAt: 'asc' },
      take: validated.limit,
    });

    const items = workflows.map(serializeWorkflow);

    // Flat { items } body per the OpenAPI contract — Aither's JobListingSchema
    // parses the top-level object directly.
    const headers = await getServiceApiHeaders(requestId, userId, role);
    return NextResponse.json({ items }, { headers });
  } catch (error) {
    logger.error(
      'Job listing failed',
      error instanceof Error ? error : new Error('unknown')
    );
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
