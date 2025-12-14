/**
 * API Route Middleware for Enhanced Error Handling
 * Provides route-specific error handling and request context management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { BaseError } from '../errors/base';
import { toHttpError } from '../errors/http';
import { mapPrismaError } from '../errors/prisma-mapping';
import {
  createErrorContext,
  recordUserAction,
  reportError,
} from '../monitoring/rollbar-official';
import { getRequestContext } from '../utils/request-context';

export interface ApiRouteContext {
  request: NextRequest;
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
  requestId: string;
}

/**
 * Enhanced API route wrapper with comprehensive error handling and Rollbar integration
 */
export function withApiErrorHandling(
  handler: (context: ApiRouteContext) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: {
      params?: Record<string, string> | Promise<Record<string, string>>;
    }
  ): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      const requestContext = await getRequestContext();
      const { searchParams } = new URL(request.url);

      // Await params if they are a Promise (Next.js 15+)
      const resolvedParams = context?.params
        ? context.params instanceof Promise
          ? await context.params
          : context.params
        : undefined;

      const apiContext: ApiRouteContext = {
        request,
        params: resolvedParams,
        searchParams,
        requestId: requestContext.id,
      };

      // Record API call for monitoring
      recordUserAction(
        `API ${request.method} ${new URL(request.url).pathname}`,
        request.headers.get('x-user-id') || undefined,
        {
          method: request.method,
          pathname: new URL(request.url).pathname,
          userAgent: request.headers.get('user-agent'),
        }
      );

      const response = await handler(apiContext);

      // Report performance if slow
      const duration = Date.now() - startTime;
      if (duration > 2000) {
        // 2 second threshold
        const errorContext = createErrorContext(
          request,
          request.headers.get('x-user-id') || undefined,
          requestContext.id
        );
        reportError(
          `Slow API Response: ${request.method} ${new URL(request.url).pathname} took ${duration}ms`,
          {
            ...errorContext,
            additionalData: {
              duration,
              performanceIssue: true,
              slowApiCall: true,
            },
          },
          'warning' as const
        );
      }

      return response;
    } catch (error) {
      // Try to map Prisma errors to domain errors first
      const mappedError = mapPrismaError(error);

      // Report unmapped errors to Rollbar
      if (!(mappedError instanceof BaseError)) {
        const requestCtx = await getRequestContext();
        const errorContext = createErrorContext(
          request,
          request.headers.get('x-user-id') || undefined,
          requestCtx.id
        );
        reportError(mappedError, errorContext, 'error');
      }

      return await toHttpError(mappedError);
    }
  };
}

/**
 * Middleware for protected API routes requiring authentication
 */
export function withAuthProtection(
  handler: (
    context: ApiRouteContext & { userId: string }
  ) => Promise<NextResponse>
) {
  return withApiErrorHandling(async context => {
    // Extract user ID from headers or session
    const _authHeader = context.request.headers.get('authorization');
    const sessionCookie = context.request.cookies.get('session')?.value;

    // For demo purposes, we'll extract from a custom header
    // In production, this would validate JWT tokens or session cookies
    const userId =
      context.request.headers.get('x-user-id') ||
      extractUserIdFromSession(sessionCookie);

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler({ ...context, userId });
  });
}

/**
 * Middleware for admin-only API routes
 */
export function withAdminProtection(
  handler: (
    context: ApiRouteContext & { userId: string; isAdmin: boolean }
  ) => Promise<NextResponse>
) {
  return withAuthProtection(async context => {
    // Check if user has admin privileges
    const isAdmin = await checkUserAdminStatus(context.userId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    return handler({ ...context, isAdmin: true });
  });
}

/**
 * Middleware for request validation using Zod schemas
 */
export function withRequestValidation<TBody = unknown, TQuery = unknown>(
  bodySchema?: { parse: (data: unknown) => TBody },
  querySchema?: { parse: (data: unknown) => TQuery }
) {
  return (
    handler: (
      context: ApiRouteContext & {
        validatedBody?: TBody;
        validatedQuery?: TQuery;
      }
    ) => Promise<NextResponse>
  ) =>
    withApiErrorHandling(async context => {
      let validatedBody: TBody | undefined;
      let validatedQuery: TQuery | undefined;

      // Validate request body if schema provided
      if (
        bodySchema &&
        (context.request.method === 'POST' || context.request.method === 'PUT')
      ) {
        try {
          const body = await context.request.json();
          validatedBody = bodySchema.parse(body);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid request body', details: error },
            { status: 400 }
          );
        }
      }

      // Validate query parameters if schema provided
      if (querySchema && context.searchParams) {
        try {
          const queryObject = Object.fromEntries(context.searchParams);
          validatedQuery = querySchema.parse(queryObject);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid query parameters', details: error },
            { status: 400 }
          );
        }
      }

      return handler({
        ...context,
        validatedBody,
        validatedQuery,
      });
    });
}

/**
 * Rate limiting middleware (simplified version)
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requests = new Map<string, number[]>();

  return (handler: (context: ApiRouteContext) => Promise<NextResponse>) =>
    withApiErrorHandling(async context => {
      const ip =
        context.request.headers.get('x-forwarded-for') ||
        context.request.headers.get('x-real-ip') ||
        'unknown';

      const now = Date.now();
      const userRequests = requests.get(ip) || [];

      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);

      if (validRequests.length >= maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }

      // Add current request
      validRequests.push(now);
      requests.set(ip, validRequests);

      return handler(context);
    });
}

/**
 * CORS middleware for API routes
 */
export function withCors(options?: {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
}) {
  const defaultOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-User-ID'],
  };

  const corsOptions = { ...defaultOptions, ...options };

  return (handler: (context: ApiRouteContext) => Promise<NextResponse>) =>
    withApiErrorHandling(async context => {
      // Handle preflight requests
      if (context.request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': Array.isArray(corsOptions.origin)
              ? corsOptions.origin.join(',')
              : corsOptions.origin,
            'Access-Control-Allow-Methods': corsOptions.methods.join(','),
            'Access-Control-Allow-Headers': corsOptions.headers.join(','),
          },
        });
      }

      const response = await handler(context);

      // Add CORS headers to response
      response.headers.set(
        'Access-Control-Allow-Origin',
        Array.isArray(corsOptions.origin)
          ? corsOptions.origin.join(',')
          : corsOptions.origin
      );

      return response;
    });
}

// Helper functions (would be implemented based on your auth system)
function extractUserIdFromSession(sessionCookie?: string): string | null {
  // Implementation depends on your session management
  // This is a placeholder
  return sessionCookie ? 'user-from-session' : null;
}

async function checkUserAdminStatus(userId: string): Promise<boolean> {
  // Implementation depends on your user management system
  // This is a placeholder
  return userId === 'admin-user-id';
}
