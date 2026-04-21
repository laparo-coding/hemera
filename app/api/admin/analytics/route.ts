/**
 * Performance Metrics API Endpoint
 * Provides analytics data for dashboard and monitoring
 */

import type { NextRequest } from 'next/server';
import { analytics } from '../../../../lib/analytics/request-analytics';
import { requireAdminUser } from '../../../../lib/auth/helpers';
import { createApiLogger } from '../../../../lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
  getCorsHeaders,
} from '../../../../lib/utils/cors';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '../../../../lib/utils/request-id';

// CORS headers for admin API access (origin restricted via getCorsHeaders)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return createCorsPreflightResponse(corsHeaders);
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

    const adminAuth = await requireAdminUser(requestId);
    if (!adminAuth.authorized) {
      logger.warn('Unauthorized analytics access attempt', {
        userId: adminAuth.userId,
      });
      return applyCorsHeaders(adminAuth.response, corsHeaders);
    }

    const userId = adminAuth.userId;

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

          return applyCorsHeaders(errorResponse, corsHeaders);
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

        return applyCorsHeaders(errorResponse, corsHeaders);
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

    return applyCorsHeaders(
      createSuccessResponse(
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
      ),
      corsHeaders
    );
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    logger.error('Error generating analytics report', normalizedError);
    logger.trackRequestCompletion(500);

    return applyCorsHeaders(
      createErrorResponse(
        'Failed to generate analytics report',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      ),
      corsHeaders
    );
  }
}
