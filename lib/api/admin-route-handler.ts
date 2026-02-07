/**
 * Admin Route Handler Factory
 * Feature: 024-admin-dashboard
 *
 * Shared wrapper that encapsulates auth, admin check, CORS, and error handling
 * for all admin API routes. Reduces boilerplate across admin endpoints.
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import { getCorsHeaders } from '@/lib/utils/cors';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

const corsHeaders = getCorsHeaders();

/** Applies CORS headers to a response */
function withCors(response: Response): Response {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

/** OPTIONS handler for CORS preflight */
export function adminOptions(): NextResponse {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface AdminHandlerOptions {
  /** Rollbar log context, e.g. 'AdminReports.Health.GET' */
  context: string;
  /** German error message for the catch-all error response */
  errorMessage: string;
}

/**
 * Creates a GET handler with built-in auth + admin check + CORS + error handling.
 *
 * Usage:
 * ```ts
 * export const GET = createAdminHandler(
 *   async (_requestId) => getHealthStatus(),
 *   { context: 'AdminReports.Health.GET', errorMessage: 'Fehler beim Abrufen des Systemstatus' }
 * );
 * ```
 */
export function createAdminHandler(
  handler: (requestId: string) => Promise<unknown>,
  options: AdminHandlerOptions
) {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = getOrCreateRequestId(request);

    try {
      // Authentication check
      let userId: string | null = null;
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch (_authError) {
        return withCors(
          createErrorResponse(
            'Nicht autorisierter Zugriff',
            ErrorCodes.UNAUTHORIZED,
            requestId,
            401
          )
        );
      }

      if (!userId) {
        return withCors(
          createErrorResponse(
            'Nicht autorisierter Zugriff',
            ErrorCodes.UNAUTHORIZED,
            requestId,
            401
          )
        );
      }

      // Admin authorization check
      const isAdmin = await checkUserAdminStatus(userId);
      if (!isAdmin) {
        return withCors(
          createErrorResponse(
            'Admin-Berechtigung erforderlich',
            ErrorCodes.FORBIDDEN,
            requestId,
            403
          )
        );
      }

      // Execute service logic
      const data = await handler(requestId);
      return withCors(createSuccessResponse(data, requestId));
    } catch (error) {
      serverInstance.error(options.errorMessage, {
        context: options.context,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return withCors(
        createErrorResponse(
          options.errorMessage,
          ErrorCodes.INTERNAL_ERROR,
          requestId,
          500
        )
      );
    }
  };
}
