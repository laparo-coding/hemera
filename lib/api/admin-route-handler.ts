/**
 * Admin Route Handler Factory
 * Feature: 024-admin-dashboard
 *
 * Shared wrapper that encapsulates auth, admin check, CORS, and error handling
 * for all admin API routes. Reduces boilerplate across admin endpoints.
 */

import type { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from '@/lib/utils/cors';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

/** OPTIONS handler for CORS preflight */
export function adminOptions(): NextResponse {
  return createCorsPreflightResponse();
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
 *   async (requestId) => getHealthStatus(),
 *   { context: 'AdminReports.Health.GET', errorMessage: 'Fehler beim Abrufen des Systemstatus' }
 * );
 * ```
 *
 * With request parameter access:
 * ```ts
 * export const GET = createAdminHandler(
 *   async (requestId, request) => {
 *     const param = request.nextUrl.searchParams.get('slug');
 *     return getDiagnosis(param, requestId);
 *   },
 *   { context: 'AdminDiagnose.Course.GET', errorMessage: 'Diagnose fehlgeschlagen' }
 * );
 * ```
 */
export function createAdminHandler(
  handler: (requestId: string, request?: NextRequest) => Promise<unknown>,
  options: AdminHandlerOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = getOrCreateRequestId(request);

    try {
      const adminAuth = await requireAdminUser(requestId);
      if (!adminAuth.authorized) {
        return applyCorsHeaders(adminAuth.response);
      }

      // Execute service logic - pass request if needed
      const data = await handler(requestId, request);
      return applyCorsHeaders(createSuccessResponse(data, requestId));
    } catch (error) {
      serverInstance.error(options.errorMessage, {
        context: options.context,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return applyCorsHeaders(
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
