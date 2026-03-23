/**
 * Performance Metrics API Endpoint
 * Provides analytics data for dashboard and monitoring
 */

import { type NextRequest, NextResponse } from 'next/server';
import { analytics } from '../../../../lib/analytics/request-analytics';
import {
  checkUserAdminStatus,
  getCurrentUser,
} from '../../../../lib/auth/helpers';
import { createApiLogger } from '../../../../lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import { getCorsHeaders } from '../../../../lib/utils/cors';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '../../../../lib/utils/request-id';

// CORS headers for admin API access (origin restricted via getCorsHeaders)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'GET',
    '/api/admin/analytics'
  );
  const logger = createApiLogger(context);

  try {
    logger.info('Analytics data request started');

    // Authentication check — single Clerk call avoids redundant auth() + currentUser()
    let userId: string | null = null;
    let authenticatedUser: Awaited<ReturnType<typeof getCurrentUser>> = null;
    try {
      authenticatedUser = await getCurrentUser();
      userId = authenticatedUser?.id ?? null;
    } catch (authError) {
      logger.warn('Auth failed', authError);
      const errorResponse = createErrorResponse(
        'Du bist nicht autorisiert',
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
      logger.warn('Unauthorized analytics access attempt');
      const errorResponse = createErrorResponse(
        'Du bist nicht autorisiert',
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

    const isAdmin = await checkUserAdminStatus(authenticatedUser);
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to access analytics', { userId });
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
    const timeframe = searchParams.get('timeframe') || '24h';
    const reportType = searchParams.get('type') || 'summary';

    logger.info('Generating analytics report', {
      timeframe,
      reportType,
      userId,
    });

    let responseData: unknown;

    switch (reportType) {
      case 'summary':
        responseData = analytics.generateReport(timeframe);
        break;

      case 'usage':
        responseData = {
          usageStats: Array.from(
            analytics.generateUsageStats(timeframe).values()
          ),
        };
        break;

      case 'anomalies':
        responseData = {
          anomalies: analytics.detectAnomalies(),
        };
        break;

      case 'trace': {
        const traceRequestId = searchParams.get('requestId');
        if (!traceRequestId) {
          const errorResponse = createErrorResponse(
            'Request ID required for trace report',
            ErrorCodes.INVALID_INPUT,
            requestId,
            400
          );

          // Add CORS headers to error response
          Object.entries(corsHeaders).forEach(([key, value]) => {
            errorResponse.headers.set(key, value);
          });

          return errorResponse;
        }
        responseData = {
          trace: analytics.getRequestTrace(traceRequestId),
        };
        break;
      }

      default: {
        const errorResponse = createErrorResponse(
          'Invalid report type',
          ErrorCodes.INVALID_INPUT,
          requestId,
          400
        );

        // Add CORS headers to error response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });

        return errorResponse;
      }
    }

    logger.info('Analytics report generated successfully', {
      reportType,
      timeframe,
      dataSize: JSON.stringify(responseData).length,
    });

    // Track business event
    logger.trackBusinessEvent('analytics_report_generated', {
      reportType,
      timeframe,
      userId,
    });

    // Track request completion
    logger.trackRequestCompletion(200);

    const response = createSuccessResponse(
      {
        report: responseData,
        metadata: {
          timeframe,
          reportType,
          generatedAt: new Date().toISOString(),
          requestId,
        },
      },
      requestId
    );

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    logger.error('Error generating analytics report', error as Error);
    logger.trackRequestCompletion(500);

    const errorResponse = createErrorResponse(
      'Failed to generate analytics report',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}
