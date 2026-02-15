/**
 * Audit logging for service API endpoints
 * Tracks all service API calls for security and compliance
 */

import { persistServiceApiLog } from '@/lib/logging/audit';
import { reportError, serverInstance } from './rollbar-official';

export interface ServiceApiAuditLog {
  userId: string;
  userRole: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  responseTime?: number;
  error?: string;
}

/**
 * Log a service API call for audit trail
 */
export function logServiceApiCall(log: ServiceApiAuditLog): void {
  const logMessage = `Service API: ${log.method} ${log.endpoint} - ${log.statusCode}`;

  // Log to console for local development
  if (process.env.NODE_ENV === 'development') {
    // biome-ignore lint: Audit logging in development
    console.log('[Service API Audit]', {
      ...log,
      timestamp: new Date(log.timestamp).toISOString(),
    });
  }

  // Log to Rollbar for production monitoring
  if (log.statusCode >= 400) {
    // Error responses
    serverInstance.error(logMessage, {
      custom: {
        type: 'service_api_audit',
        ...log,
      },
    });
  } else {
    // Success responses (info level)
    serverInstance.info(logMessage, {
      custom: {
        type: 'service_api_audit',
        ...log,
      },
    });
  }

  // Persist a compact audit record in the database (non-blocking)
  void persistServiceApiLog({
    serviceUserId: log.userId,
    endpoint: log.endpoint,
    method: log.method,
    responseStatus: log.statusCode,
    ipAddress: log.ipAddress ?? null,
    metadata: {
      requestId: log.requestId,
      userRole: log.userRole,
      responseTime: log.responseTime,
    },
  }).catch((err: unknown) => {
    // swallow errors from audit persistence to avoid impacting request flow
    try {
      const error = err instanceof Error ? err : new Error(String(err));
      reportError(error, {
        additionalData: { context: 'serviceApiLogger.persist' },
      });
    } catch {
      // swallow
    }
  });
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(headers: Headers): string | undefined {
  // Check common headers for IP address
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : undefined;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    const firstIp = vercelForwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : undefined;
  }

  return undefined;
}

/**
 * Create audit log entry from request/response data
 */
export function createAuditLog(
  userId: string,
  userRole: string,
  endpoint: string,
  method: string,
  statusCode: number,
  requestId: string,
  headers?: Headers,
  startTime?: number
): ServiceApiAuditLog {
  const timestamp = new Date().toISOString();
  const responseTime = startTime ? Date.now() - startTime : undefined;

  return {
    userId,
    userRole,
    endpoint,
    method,
    statusCode,
    requestId,
    timestamp,
    ipAddress: headers ? extractIpAddress(headers) : undefined,
    userAgent: headers?.get('user-agent') ?? undefined,
    responseTime,
  };
}
