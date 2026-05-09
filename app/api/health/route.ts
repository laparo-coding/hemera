import type { NextRequest } from 'next/server';
import { getClerkKeyMismatchReason } from '../../../lib/auth/clerk-key-validation';
import { getBuildInfo } from '../../../lib/buildInfo';
import { createApiLogger } from '../../../lib/utils/api-logger';
import { createSuccessResponse } from '../../../lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '../../../lib/utils/request-id';

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'GET', '/api/health');
  const logger = createApiLogger(context);

  const info = getBuildInfo();
  const clerkConfigured =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);
  let clerkBypassReason: string | null = null;

  try {
    clerkBypassReason = getClerkKeyMismatchReason(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      process.env.CLERK_SECRET_KEY
    );
  } catch (error) {
    logger.error(
      'Failed to evaluate Clerk key mismatch for health check',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: info.environment,
    version: info.version,
    commitSha: info.commitSha,
    shortSha: info.shortSha,
    buildTime: info.buildTime,
  } as const;

  logger.info('Health check completed', {
    ...healthData,
    auth: {
      clerk: {
        configured: clerkConfigured,
        bypassed: clerkBypassReason !== null,
      },
    },
  });
  logger.trackRequestCompletion(200);

  return createSuccessResponse(healthData, requestId);
}
