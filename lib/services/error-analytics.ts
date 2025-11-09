/**
 * Error Analytics Service
 * Tracks and analyzes error patterns for debugging and monitoring
 */

import { BaseError } from '@/lib/errors/base';

export interface ErrorMetrics {
  errorCount: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsByHour: Record<string, number>;
  topErrors: Array<{
    code: string;
    message: string;
    count: number;
    lastOccurrence: string;
  }>;
  avgResponseTime?: number;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  errorCode: string;
  category: string;
  message: string;
  statusCode: number;
  requestId: string;
  context?: Record<string, any>;
  userAgent?: string;
  ip?: string;
  resolved: boolean;
}

/**
 * In-memory error tracking (for development)
 * In production, this would be replaced with a proper database or monitoring service
 */
class ErrorAnalyticsService {
  private errorLogs: ErrorLogEntry[] = [];
  private readonly maxLogs = 1000; // Keep only last 1000 errors in memory

  /**
   * Record an error occurrence
   */
  recordError(
    error: BaseError | Error,
    context?: {
      requestId?: string;
      userAgent?: string;
      ip?: string;
      additionalContext?: Record<string, any>;
    }
  ): void {
    const entry: ErrorLogEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      errorCode: error instanceof BaseError ? error.errorCode : 'UNKNOWN_ERROR',
      category: error instanceof BaseError ? error.category : 'infrastructure',
      message: error.message,
      statusCode: error instanceof BaseError ? error.statusCode : 500,
      requestId: context?.requestId || 'unknown',
      context: {
        ...(error instanceof BaseError ? error.context : {}),
        ...context?.additionalContext,
      },
      userAgent: context?.userAgent,
      ip: context?.ip,
      resolved: false,
    };

    this.errorLogs.push(entry);

    // Keep only the most recent errors
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }

    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Get error metrics for dashboard
   */
  getErrorMetrics(timeRange: 'hour' | 'day' | 'week' = 'day'): ErrorMetrics {
    const _now = new Date();
    const timeFilter = this.getTimeFilter(timeRange);

    const recentErrors = this.errorLogs.filter(
      log => new Date(log.timestamp) >= timeFilter
    );

    const errorsByCategory = recentErrors.reduce(
      (acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsByCode = recentErrors.reduce(
      (acc, log) => {
        acc[log.errorCode] = (acc[log.errorCode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsByHour = recentErrors.reduce(
      (acc, log) => {
        const hour = new Date(log.timestamp)
          .getHours()
          .toString()
          .padStart(2, '0');
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get top 10 most frequent errors
    const topErrors = Object.entries(errorsByCode)
      .map(([code, count]) => {
        const lastError = recentErrors
          .filter(log => log.errorCode === code)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];

        return {
          code,
          message: lastError?.message || 'Unknown error',
          count,
          lastOccurrence: lastError?.timestamp || 'Unknown',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      errorCount: recentErrors.length,
      errorsByCategory,
      errorsByCode,
      errorsByHour,
      topErrors,
    };
  }

  /**
   * Get recent error logs with pagination
   */
  getRecentErrors(
    page = 1,
    limit = 50
  ): {
    errors: ErrorLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const total = this.errorLogs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const errors = this.errorLogs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(startIndex, endIndex);

    return {
      errors,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errorLogs.find(log => log.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all error logs (useful for testing)
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  private getTimeFilter(timeRange: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private async sendToMonitoring(_error: ErrorLogEntry): Promise<void> {
    // In production, integrate with monitoring services like:
    // - Sentry: Sentry.captureException(error)
    // - DataDog: datadogLogger.error(error)
    // - AWS CloudWatch: cloudWatchLogs.putLogEvents(error)
    // - New Relic: newrelic.recordCustomEvent('Error', error)
    // Temporarily disabled console logging for production
  }
}

// Singleton instance
export const errorAnalytics = new ErrorAnalyticsService();
