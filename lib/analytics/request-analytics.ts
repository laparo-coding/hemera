/**
 * Request ID-basierte Analytics für Performance-Monitoring
 */

import { serverInstance } from '../monitoring/rollbar-official';
import type { RequestContext } from '../utils/request-id';

export interface AnalyticsEvent {
  requestId: string;
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
  context: RequestContext;
}

export interface PerformanceMetrics {
  requestId: string;
  route: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  timestamp: string;
}

export interface ApiUsageStats {
  route: string;
  method: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  successfulRequests: number;
  failedRequests: number;
  timeframe: string;
}

export class RequestAnalytics {
  private static instance: RequestAnalytics;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private events: AnalyticsEvent[] = [];

  public static getInstance(): RequestAnalytics {
    if (!RequestAnalytics.instance) {
      RequestAnalytics.instance = new RequestAnalytics();
    }
    return RequestAnalytics.instance;
  }

  /**
   * Tracke Performance-Metriken für Request
   */
  public trackPerformance(
    requestId: string,
    route: string,
    method: string,
    startTime: number,
    statusCode: number,
    context?: RequestContext
  ): void {
    const responseTime = Date.now() - startTime;

    const metrics: PerformanceMetrics = {
      requestId,
      route,
      method,
      responseTime,
      statusCode,
      userAgent: context?.userAgent,
      ip: context?.ip,
      timestamp: new Date().toISOString(),
    };

    this.metrics.set(requestId, metrics);

    // An Rollbar senden
    serverInstance.info('API Performance Metric', {
      requestId,
      route,
      method,
      responseTime,
      statusCode,
      context,
      category: 'performance',
      timestamp: metrics.timestamp,
    });

    // Performance-Alerts bei langsamen Requests
    if (responseTime > 2000) {
      this.trackEvent(
        requestId,
        'slow_request',
        {
          route,
          method,
          responseTime,
          threshold: 2000,
        },
        context
      );
    }
  }

  /**
   * Tracke benutzerdefinierte Analytics-Events
   */
  public trackEvent(
    requestId: string,
    eventType: string,
    data: Record<string, unknown>,
    context?: RequestContext
  ): void {
    const event: AnalyticsEvent = {
      requestId,
      eventType,
      timestamp: new Date().toISOString(),
      data,
      context: context || {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: 'UNKNOWN',
        url: 'unknown',
      },
    };

    this.events.push(event);

    // An Rollbar senden
    serverInstance.info(`Analytics Event: ${eventType}`, {
      requestId,
      eventType,
      data,
      context,
      category: 'analytics',
      timestamp: event.timestamp,
    });
  }

  /**
   * Generiere API-Usage-Statistiken
   */
  public generateUsageStats(
    timeframe: string = '24h'
  ): Map<string, ApiUsageStats> {
    const stats = new Map<string, ApiUsageStats>();
    const now = Date.now();
    const timeframeMs = this.parseTimeframe(timeframe);

    // Filtere Metriken nach Zeitraum
    const relevantMetrics = Array.from(this.metrics.values()).filter(
      metric => now - new Date(metric.timestamp).getTime() <= timeframeMs
    );

    // Gruppiere nach Route und Method
    const grouped = new Map<string, PerformanceMetrics[]>();

    relevantMetrics.forEach(metric => {
      const key = `${metric.method}:${metric.route}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(metric);
    });

    // Berechne Statistiken für jede Gruppe
    grouped.forEach((metrics, key) => {
      const [method, route] = key.split(':');
      if (!method || !route) return;

      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter(m => m.statusCode < 400).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime =
        metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
      const errorRate = (failedRequests / totalRequests) * 100;

      stats.set(key, {
        route,
        method,
        totalRequests,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        successfulRequests,
        failedRequests,
        timeframe,
      });
    });

    return stats;
  }

  /**
   * Finde alle Events für eine Request ID
   */
  public getRequestTrace(requestId: string): {
    metrics?: PerformanceMetrics;
    events: AnalyticsEvent[];
  } {
    return {
      metrics: this.metrics.get(requestId),
      events: this.events.filter(event => event.requestId === requestId),
    };
  }

  /**
   * Erkenne Performance-Anomalien
   */
  public detectAnomalies(): {
    slowRequests: PerformanceMetrics[];
    highErrorRates: ApiUsageStats[];
    unusualPatterns: AnalyticsEvent[];
  } {
    const stats = this.generateUsageStats('1h');

    const slowRequests = Array.from(this.metrics.values())
      .filter(metric => metric.responseTime > 3000)
      .slice(-10); // Letzten 10 langsamen Requests

    const highErrorRates = Array.from(stats.values()).filter(
      stat => stat.errorRate > 10 && stat.totalRequests > 5
    );

    const unusualPatterns = this.events
      .filter(
        event =>
          event.eventType === 'slow_request' ||
          event.eventType === 'error_spike'
      )
      .slice(-20); // Letzten 20 ungewöhnlichen Events

    return {
      slowRequests,
      highErrorRates,
      unusualPatterns,
    };
  }

  /**
   * Generiere Analytics-Report
   */
  public generateReport(timeframe: string = '24h'): {
    summary: {
      totalRequests: number;
      averageResponseTime: number;
      overallErrorRate: number;
      topRoutes: Array<{ route: string; count: number }>;
    };
    apiStats: ApiUsageStats[];
    anomalies: {
      slowRequests: PerformanceMetrics[];
      highErrorRates: ApiUsageStats[];
      unusualPatterns: AnalyticsEvent[];
    };
  } {
    const stats = this.generateUsageStats(timeframe);
    const apiStats = Array.from(stats.values());

    const totalRequests = apiStats.reduce(
      (sum, stat) => sum + stat.totalRequests,
      0
    );
    const totalFailedRequests = apiStats.reduce(
      (sum, stat) => sum + stat.failedRequests,
      0
    );
    const weightedResponseTime = apiStats.reduce(
      (sum, stat) => sum + stat.averageResponseTime * stat.totalRequests,
      0
    );

    const averageResponseTime =
      totalRequests > 0 ? Math.round(weightedResponseTime / totalRequests) : 0;
    const overallErrorRate =
      totalRequests > 0
        ? Math.round((totalFailedRequests / totalRequests) * 10000) / 100
        : 0;

    const topRoutes = apiStats
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10)
      .map(stat => ({
        route: `${stat.method} ${stat.route}`,
        count: stat.totalRequests,
      }));

    return {
      summary: {
        totalRequests,
        averageResponseTime,
        overallErrorRate,
        topRoutes,
      },
      apiStats: apiStats.sort((a, b) => b.totalRequests - a.totalRequests),
      anomalies: this.detectAnomalies(),
    };
  }

  /**
   * Cleanup alte Metriken (Memory-Management)
   */
  public cleanup(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    // Entferne alte Metriken
    for (const [requestId, metric] of this.metrics.entries()) {
      if (new Date(metric.timestamp).getTime() < cutoffTime) {
        this.metrics.delete(requestId);
      }
    }

    // Entferne alte Events
    this.events = this.events.filter(
      event => new Date(event.timestamp).getTime() >= cutoffTime
    );
  }

  private parseTimeframe(timeframe: string): number {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1), 10);

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default 24h
    }
  }
}

// Singleton-Instanz exportieren
export const analytics = RequestAnalytics.getInstance();

// Auto-Cleanup alle 6 Stunden (nicht in Tests/E2E)
const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  typeof process.env.JEST_WORKER_ID !== 'undefined' ||
  process.env.E2E_TEST === '1';

let cleanupTimer: ReturnType<typeof setInterval> | undefined;

if (!isTestEnv && typeof setInterval !== 'undefined') {
  cleanupTimer = setInterval(
    () => {
      analytics.cleanup(24);
    },
    6 * 60 * 60 * 1000
  );
}

// Optional: Explizites Stoppen ermöglichen (z.B. für manuelle Teardown-Schritte in Tests)
export function stopRequestAnalyticsScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
  }
}
