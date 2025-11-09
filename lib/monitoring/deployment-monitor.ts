/**
 * Deployment Health Monitoring für Hemera
 * Überwacht Deployment-Status, Service-Health und kritische Metriken
 */

import { analytics } from '@/lib/analytics/request-analytics';
import { deploymentAlerts } from '@/lib/monitoring/deployment-alerts';
import { serverInstance } from '@/lib/monitoring/rollbar-official';

interface DeploymentMetrics {
  version: string;
  deploymentId: string;
  timestamp: string;
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: any;
  lastChecked: string;
}

interface ServiceStatus {
  database: HealthCheck;
  authentication: HealthCheck;
  stripe: HealthCheck;
  rollbar: HealthCheck;
  analytics: HealthCheck;
}

export class DeploymentMonitor {
  private static instance: DeploymentMonitor;
  private deploymentInfo: DeploymentMetrics;

  constructor() {
    this.deploymentInfo = {
      version: process.env.npm_package_version || '1.0.0',
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION || 'local',
      status: 'healthy',
      checks: [],
    };
  }

  public static getInstance(): DeploymentMonitor {
    if (!DeploymentMonitor.instance) {
      DeploymentMonitor.instance = new DeploymentMonitor();
    }
    return DeploymentMonitor.instance;
  }

  /**
   * Führt umfassende Health-Checks durch
   */
  public async performHealthChecks(): Promise<ServiceStatus> {
    const startTime = Date.now();

    const serviceStatus: ServiceStatus = {
      database: await this.checkDatabase(),
      authentication: await this.checkAuthentication(),
      stripe: await this.checkStripe(),
      rollbar: await this.checkRollbar(),
      analytics: await this.checkAnalytics(),
    };

    // Deployment-Status bewerten
    const failedChecks = Object.values(serviceStatus).filter(
      check => check.status === 'fail'
    );
    const warnChecks = Object.values(serviceStatus).filter(
      check => check.status === 'warn'
    );

    this.deploymentInfo.status =
      failedChecks.length > 0
        ? 'unhealthy'
        : warnChecks.length > 0
          ? 'degraded'
          : 'healthy';

    this.deploymentInfo.checks = Object.values(serviceStatus);

    // An Rollbar melden
    await this.reportDeploymentStatus(serviceStatus);

    // Analytics tracken
    analytics.trackEvent(
      `health-check-${Date.now()}`,
      'deployment_health_check',
      {
        status: this.deploymentInfo.status,
        checkDuration: Date.now() - startTime,
        failedChecks: failedChecks.length,
        warnChecks: warnChecks.length,
        deployment: this.deploymentInfo,
      }
    );

    // Alert-System evaluieren
    await deploymentAlerts.evaluateHealthChecks({
      deployment: this.deploymentInfo,
      services: serviceStatus,
      summary: {
        overallStatus: this.deploymentInfo.status,
        failedChecks: failedChecks.length,
        warnChecks: warnChecks.length,
      },
    });

    return serviceStatus;
  }

  /**
   * Database-Connectivity prüfen
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Dynamischer Import von Prisma
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();

      return {
        name: 'database',
        status: 'pass',
        responseTime: Date.now() - startTime,
        details: { provider: 'postgresql', connection: 'verified' },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Authentication-Service prüfen
   */
  private async checkAuthentication(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Clerk API-Status prüfen
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (!clerkSecretKey) {
        throw new Error('Clerk Secret Key nicht konfiguriert');
      }

      return {
        name: 'authentication',
        status: 'pass',
        responseTime: Date.now() - startTime,
        details: { provider: 'clerk', configured: true },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'authentication',
        status: 'fail',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Stripe-Integration prüfen
   */
  private async checkStripe(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Stripe Secret Key nicht konfiguriert');
      }

      return {
        name: 'stripe',
        status: 'pass',
        responseTime: Date.now() - startTime,
        details: { provider: 'stripe', configured: true },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'stripe',
        status: 'fail',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Rollbar-Monitoring prüfen
   */
  private async checkRollbar(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const rollbarToken = process.env.ROLLBAR_SERVER_ACCESS_TOKEN;
      if (!rollbarToken) {
        throw new Error('Rollbar Access Token nicht konfiguriert');
      }

      // Test-Message an Rollbar senden
      serverInstance.info('Deployment Health Check', {
        timestamp: new Date().toISOString(),
        deployment: this.deploymentInfo,
      });

      return {
        name: 'rollbar',
        status: 'pass',
        responseTime: Date.now() - startTime,
        details: { provider: 'rollbar', configured: true },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'rollbar',
        status: 'warn',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Analytics-System prüfen
   */
  private async checkAnalytics(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Analytics-System testen
      const analyticsInstance = analytics;
      if (!analyticsInstance) {
        throw new Error('Analytics-System nicht verfügbar');
      }

      return {
        name: 'analytics',
        status: 'pass',
        responseTime: Date.now() - startTime,
        details: { system: 'request-analytics', operational: true },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'analytics',
        status: 'warn',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Deployment-Status an Rollbar melden
   */
  private async reportDeploymentStatus(
    serviceStatus: ServiceStatus
  ): Promise<void> {
    const deploymentData = {
      ...this.deploymentInfo,
      serviceStatus,
      metadata: {
        environment: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION,
        buildId: process.env.NEXT_BUILD_ID,
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
      },
    };

    if (this.deploymentInfo.status === 'unhealthy') {
      serverInstance.error('Deployment Unhealthy', deploymentData);
    } else if (this.deploymentInfo.status === 'degraded') {
      serverInstance.warning('Deployment Degraded', deploymentData);
    } else {
      serverInstance.info('Deployment Healthy', deploymentData);
    }
  }

  /**
   * Kontinuierliche Überwachung starten
   */
  public startContinuousMonitoring(intervalMinutes: number = 5): void {
    // Initial-Check
    this.performHealthChecks();

    // Periodische Checks
    setInterval(
      async () => {
        await this.performHealthChecks();
      },
      intervalMinutes * 60 * 1000
    );

    serverInstance.info('Continuous Deployment Monitoring Started', {
      interval: `${intervalMinutes} minutes`,
      deployment: this.deploymentInfo,
    });
  }

  /**
   * Aktuellen Deployment-Status abrufen
   */
  public getDeploymentStatus(): DeploymentMetrics {
    return this.deploymentInfo;
  }
}

// Singleton-Instanz exportieren
export const deploymentMonitor = DeploymentMonitor.getInstance();
