/**
 * Error Analytics API Route
 * Provides error metrics and logs for monitoring dashboard
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../lib/auth/helpers';
import { withErrorHandling } from '../../../../lib/errors';
import { errorAnalytics } from '../../../../lib/services/error-analytics';
import {
  createErrorResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../lib/utils/request-id';

// CORS headers for external app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);

  // Authentication check
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (_authError) {
    // In E2E test mode, auth() might fail, return 401
    const errorResponse = createErrorResponse(
      'Unauthorized access',
      ErrorCodes.UNAUTHORIZED,
      requestId,
      401
    );

    // Add CORS headers to error response
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

    // Add CORS headers to error response
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

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'metrics';
  const timeRange = (searchParams.get('timeRange') || 'day') as
    | 'hour'
    | 'day'
    | 'week';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let responseData: NextResponse;
  switch (action) {
    case 'metrics': {
      const metrics = errorAnalytics.getErrorMetrics(timeRange);
      responseData = NextResponse.json(metrics);
      break;
    }

    case 'logs': {
      const logs = errorAnalytics.getRecentErrors(page, limit);
      responseData = NextResponse.json(logs);
      break;
    }

    default:
      responseData = NextResponse.json(
        { error: 'Invalid action. Use "metrics" or "logs".' },
        { status: 400 }
      );
  }

  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseData.headers.set(key, value);
  });

  return responseData;
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestId = getOrCreateRequestId(request);

  // Authentication check
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (_authError) {
    // In E2E test mode, auth() might fail, return 401
    const errorResponse = createErrorResponse(
      'Unauthorized access',
      ErrorCodes.UNAUTHORIZED,
      requestId,
      401
    );

    // Add CORS headers to error response
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

    // Add CORS headers to error response
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

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  let responseData: NextResponse;
  switch (action) {
    case 'resolve': {
      const { errorId } = await request.json();
      const resolved = errorAnalytics.resolveError(errorId);

      responseData = NextResponse.json({
        success: resolved,
        message: resolved ? 'Error marked as resolved' : 'Error not found',
      });
      break;
    }

    case 'clear': {
      // Only allow in development
      if (process.env.NODE_ENV === 'development') {
        errorAnalytics.clearLogs();
        responseData = NextResponse.json({ message: 'Error logs cleared' });
      } else {
        responseData = NextResponse.json(
          { error: 'Action not allowed in production' },
          { status: 403 }
        );
      }
      break;
    }

    default:
      responseData = NextResponse.json(
        { error: 'Invalid action. Use "resolve" or "clear".' },
        { status: 400 }
      );
  }

  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseData.headers.set(key, value);
  });

  return responseData;
});
