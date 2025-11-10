/**
 * Enhanced logging utilities for API routes with request context using Rollbar
 */

import { analytics } from '@/lib/analytics/request-analytics';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import type { RequestContext } from '@/lib/utils/request-id';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  context: RequestContext;
  data?: unknown;
  error?: Error;
  timestamp: string;
}

/**
 * Enhanced logger with request context that uses Rollbar and Analytics
 */
export class ApiLogger {
  private startTime: number = Date.now();

  constructor(private requestContext: RequestContext) {}

  /**
   * Log an error with structured context via Rollbar and track analytics
   */
  error(message: string, error?: Error, data?: unknown): void {
    serverInstance.error(message, {
      requestId: this.requestContext.id,
      error: error?.message,
      stack: error?.stack,
      data,
      context: this.requestContext,
      timestamp: new Date().toISOString(),
    });

    // Track error event in analytics
    analytics.trackEvent(
      this.requestContext.id,
      'api_error',
      {
        message,
        errorType: error?.name,
        route: this.requestContext.url,
        method: this.requestContext.method,
        data,
      },
      this.requestContext
    );
  }

  /**
   * Log a warning with structured context via Rollbar and track analytics
   */
  warn(message: string, data?: unknown): void {
    serverInstance.warn(message, {
      requestId: this.requestContext.id,
      data,
      context: this.requestContext,
      timestamp: new Date().toISOString(),
    });

    // Track warning event in analytics
    analytics.trackEvent(
      this.requestContext.id,
      'api_warning',
      {
        message,
        route: this.requestContext.url,
        method: this.requestContext.method,
        data,
      },
      this.requestContext
    );
  }

  /**
   * Log info with structured context via Rollbar
   */
  info(message: string, data?: unknown): void {
    serverInstance.info(message, {
      requestId: this.requestContext.id,
      data,
      context: this.requestContext,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log debug information (only in development) via Rollbar
   */
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      serverInstance.debug?.(message, {
        requestId: this.requestContext.id,
        data,
        context: this.requestContext,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track request completion with performance metrics
   */
  trackRequestCompletion(statusCode: number): void {
    analytics.trackPerformance(
      this.requestContext.id,
      this.requestContext.url,
      this.requestContext.method,
      this.startTime,
      statusCode,
      this.requestContext
    );
  }

  /**
   * Track custom business event
   */
  trackBusinessEvent(eventType: string, data: Record<string, unknown>): void {
    analytics.trackEvent(
      this.requestContext.id,
      eventType,
      data,
      this.requestContext
    );
  }
}

/**
 * Create an API logger instance with request context
 */
export function createApiLogger(requestContext: RequestContext): ApiLogger {
  return new ApiLogger(requestContext);
}
