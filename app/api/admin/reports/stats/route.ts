/**
 * Admin Reports Stats API Route
 * Feature: 024-admin-dashboard
 *
 * GET /api/admin/reports/stats - Returns dashboard statistics
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminReports } from '@/lib/api/admin-reports';
import { checkUserAdminStatus } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import { getCorsHeaders } from '@/lib/utils/cors';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

// CORS headers restricted to same origin (not wildcard)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Get reports data
    const reports = await getAdminReports();

    const response = createSuccessResponse(reports, requestId);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    serverInstance.error('Failed to fetch reports', {
      context: 'AdminReports.Stats.GET',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Failed to fetch reports',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}
