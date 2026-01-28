/**
 * HTTP Error Response Mapping
 * Converts domain errors to standardized HTTP responses
 */

import { NextResponse } from 'next/server';
import { errorAnalytics } from '../services/error-analytics';
import {
  getRequestContext,
  getRequestId,
  logErrorWithContext,
} from '../utils/request-context';
import { BaseError } from './base';

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    category: string;
    statusCode: number;
    context?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Convert any error to a standardized HTTP response
 */
export async function toHttpError(
  error: unknown,
  requestId?: string
): Promise<NextResponse<ApiErrorResponse>> {
  const reqId = requestId || (await getRequestId());
  const requestContext = await getRequestContext();

  // Record error in analytics
  if (error instanceof BaseError || error instanceof Error) {
    errorAnalytics.recordError(error, {
      requestId: reqId,
      userAgent: requestContext.userAgent,
      ip: requestContext.ip,
    });
  }

  // Handle our custom errors
  if (error instanceof BaseError) {
    await logErrorWithContext(error, {
      errorCategory: error.category,
      errorCode: error.errorCode,
    });

    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.errorCode,
          category: error.category,
          statusCode: error.statusCode,
          context: error.context,
          timestamp: new Date().toISOString(),
          requestId: reqId,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle specific known errors
  if (error instanceof Error) {
    const statusCode = getStatusCodeForError(error);
    await logErrorWithContext(error, { errorType: 'standard', statusCode });

    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: 'UNKNOWN_ERROR',
          category: 'infrastructure',
          statusCode,
          timestamp: new Date().toISOString(),
          requestId: reqId,
        },
      },
      { status: statusCode }
    );
  }

  // Handle unknown errors
  await logErrorWithContext(error, { errorType: 'unknown' });

  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        category: 'infrastructure',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: reqId,
      },
    },
    { status: 500 }
  );
}

/**
 * Check if an error is a Prisma error by inspecting its properties.
 *
 * **Why heuristics over instanceof/constructor.name:**
 * - `instanceof` checks fail across module boundaries and bundler configurations
 * - `constructor.name` is brittle: minification can mangle names, and mocking
 *   in tests requires fragile `Object.defineProperty` hacks
 * - Prisma errors consistently have a `clientVersion` property, and known
 *   request errors have a `code` starting with 'P' (e.g., P2002)
 * - These structural checks are stable across Prisma versions and test environments
 *
 * @param error - The error to check
 * @returns Object indicating if it's a Prisma error and its type
 */
function isPrismaError(error: Error): {
  isPrisma: boolean;
  type?: 'known' | 'validation' | 'unknown';
} {
  const err = error as Record<string, unknown>;

  // PrismaClientKnownRequestError has a 'code' property starting with 'P'
  if (
    typeof err.code === 'string' &&
    err.code.startsWith('P') &&
    'clientVersion' in err
  ) {
    return { isPrisma: true, type: 'known' };
  }

  // PrismaClientValidationError has specific message patterns
  if (
    'clientVersion' in err &&
    (error.message.includes('Invalid') ||
      error.message.includes('Argument') ||
      error.message.includes('Unknown arg'))
  ) {
    return { isPrisma: true, type: 'validation' };
  }

  // PrismaClientUnknownRequestError has clientVersion but no code
  if ('clientVersion' in err && !('code' in err)) {
    return { isPrisma: true, type: 'unknown' };
  }

  return { isPrisma: false };
}

/**
 * Get appropriate HTTP status code for standard errors
 */
function getStatusCodeForError(error: Error): number {
  // Check for Prisma errors first using robust detection
  const prismaCheck = isPrismaError(error);
  if (prismaCheck.isPrisma) {
    switch (prismaCheck.type) {
      case 'known':
        return 400;
      case 'validation':
        return 422;
      case 'unknown':
        return 500;
    }
  }

  // Fallback to constructor name for other known error types
  const errorName = error.constructor.name;

  switch (errorName) {
    case 'NotFoundError':
      return 404;
    case 'ValidationError':
      return 422;
    case 'UnauthorizedError':
      return 401;
    case 'ForbiddenError':
      return 403;
    default:
      return 500;
  }
}

/**
 * Error logging utility with structured format
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  logErrorWithContext(error, context);
}

/**
 * Middleware helper for consistent error handling in API routes
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      logError(error, { handler: handler.name });
      return await toHttpError(error);
    }
  };
}
