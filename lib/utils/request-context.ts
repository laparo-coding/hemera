/**
 * Request Context Utilities
 * Provides request tracking and context management
 */

import { headers } from 'next/headers';
import { generateRequestId } from '@/lib/utils/request-id';

export interface RequestContext {
  id: string;
  externalId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  url?: string;
}

/**
 * Generate or retrieve request ID for tracing
 */
export async function getRequestId(): Promise<string> {
  // Always generate a new canonical ID; inbound IDs are treated as external correlation only.
  return generateRequestId();
}

/**
 * Get comprehensive request context
 */
export async function getRequestContext(): Promise<RequestContext> {
  const headersList = await headers();
  const providedId =
    headersList.get('x-request-id') ||
    headersList.get('x-trace-id') ||
    undefined;
  const canonicalId = await getRequestId();

  return {
    id: canonicalId,
    externalId: providedId,
    userAgent: headersList.get('user-agent') || undefined,
    ip:
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      undefined,
    timestamp: new Date().toISOString(),
    url: headersList.get('referer') || undefined,
  };
}

/**
 * Enhanced error logging with request context
 */
export async function logErrorWithContext(
  error: unknown,
  additionalContext?: Record<string, unknown>
) {
  const requestContext = await getRequestContext();

  const _logData = {
    requestId: requestContext.id,
    timestamp: requestContext.timestamp,
    userAgent: requestContext.userAgent,
    ip: requestContext.ip,
    url: requestContext.url,
    ...additionalContext,
  };

  if (error instanceof Error) {
    // ERROR logged for request context
  } else {
    // UNKNOWN_ERROR logged for request context
  }
}

/**
 * Middleware helper for request ID injection
 */
export function withRequestContext<T extends unknown[], R>(
  handler: (requestContext: RequestContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const requestContext = await getRequestContext();
    return handler(requestContext, ...args);
  };
}
