/**
 * Service API Response Utilities
 * Standardized response helpers for /api/service/* endpoints
 */

import { NextResponse } from 'next/server';
import type { UserRole } from '../auth/permissions';
import { getRateLimitHeaders } from '../middleware/rate-limit';
import { ErrorCodes } from './api-response';

/**
 * CORS configuration for Service API
 * Allows cross-origin requests from trusted domains
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Configure specific origins in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Max-Age': '86400', // 24 hours
} as const;

/**
 * Standard error response structure for Service API
 */
export interface ServiceApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

/**
 * Standard success response structure for Service API
 */
export interface ServiceApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

/**
 * Get all standard headers for Service API responses
 * Includes CORS, Rate Limit, and Request ID headers
 */
export async function getServiceApiHeaders(
  requestId: string,
  userId?: string,
  role?: UserRole
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
  };

  // Add rate limit headers if user context is available
  if (userId && role) {
    const rateLimitHeaders = await getRateLimitHeaders(userId, role);
    Object.assign(headers, rateLimitHeaders);
  }

  return headers;
}

/**
 * Create a standardized error response for Service API
 * Ensures no implementation details leak in error messages
 */
export async function createServiceApiErrorResponse(
  message: string,
  code: string,
  requestId: string,
  httpStatus: number,
  userId?: string,
  role?: UserRole,
  details?: Record<string, unknown>
): Promise<NextResponse<ServiceApiErrorResponse>> {
  // Sanitize error message to prevent leaking implementation details
  const sanitizedMessage = sanitizeErrorMessage(message, httpStatus);

  const errorResponse: ServiceApiErrorResponse = {
    success: false,
    error: {
      code,
      message: sanitizedMessage,
      ...(details && { details }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  const headers = await getServiceApiHeaders(requestId, userId, role);

  return NextResponse.json(errorResponse, {
    status: httpStatus,
    headers,
  });
}

/**
 * Create a standardized success response for Service API
 */
export async function createServiceApiSuccessResponse<T>(
  requestId: string,
  userId: string,
  role: UserRole,
  data?: T,
  message?: string,
  httpStatus = 200
): Promise<NextResponse<ServiceApiSuccessResponse<T>>> {
  const successResponse: ServiceApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  const headers = await getServiceApiHeaders(requestId, userId, role);

  return NextResponse.json(successResponse, {
    status: httpStatus,
    headers,
  });
}

/**
 * Sanitize error messages to prevent leaking implementation details
 * Maps internal errors to safe, user-facing messages
 */
function sanitizeErrorMessage(message: string, httpStatus: number): string {
  // For 5xx errors, always return generic message
  if (httpStatus >= 500) {
    return 'Internal server error';
  }

  // For 4xx errors, check if message contains sensitive patterns
  const sensitivePatterns = [
    /prisma/i,
    /database/i,
    /sql/i,
    /query/i,
    /connection/i,
    /timeout/i,
    /stack trace/i,
    /error:/i,
    /exception/i,
    /\.ts:/i,
    /\.js:/i,
    /at \w+\./i, // Stack trace patterns
  ];

  const containsSensitiveInfo = sensitivePatterns.some(pattern =>
    pattern.test(message)
  );

  if (containsSensitiveInfo) {
    // Map to appropriate generic message based on status code
    switch (httpStatus) {
      case 400:
        return 'Invalid request';
      case 401:
        return 'Not authenticated';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Resource not found';
      case 429:
        return 'Too many requests. Please try again later.';
      default:
        return 'Request failed';
    }
  }

  return message;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function handleOptionsRequest(
  requestId: string
): Promise<NextResponse> {
  const headers = await getServiceApiHeaders(requestId);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
