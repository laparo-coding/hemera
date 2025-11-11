/**
 * Deployment Alert System
 * Automatische Benachrichtigungen bei kritischen Deployment-Problemen
 */

import { analytics } from "@/lib/analytics/request-analytics";
import { serverInstance } from "@/lib/monitoring/rollbar-official";

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: "critical" | "warning" | "info";
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
  threshold: number;
  timeWindow: number; // in seconds
}

export interface NotificationChannel {
  type: "rollbar" | "webhook" | "email";
  config: Record<string, unknown>;
}

export interface DeploymentAlert {
  id: string;
  ruleId: string;
  timestamp: string;
  severity: string;
  message: string;
  details: unknown;
  resolved: boolean;
}

export class DeploymentAlertSystem {
  private static instance: DeploymentAlertSystem;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, DeploymentAlert> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): DeploymentAlertSystem {
    if (!DeploymentAlertSystem.instance) {
      DeploymentAlertSystem.instance = new DeploymentAlertSystem();
    }
    return DeploymentAlertSystem.instance;
  }

  /**
   * Standard-Alert-Regeln initialisieren
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "database_connection_failure",
        name: "Database Connection Failure",
        condition: {
          metric: "database_health",
          operator: "eq",
          threshold: 0, // 0 = failed
          timeWindow: 60,
        },
        severity: "critical",
        channels: [{ type: "rollbar", config: { level: "critical" } }],
        enabled: true,
      },
      {
        id: "authentication_service_down",
        name: "Authentication Service Down",
        condition: {
          metric: "auth_health",
          operator: "eq",
          threshold: 0,
          timeWindow: 60,
        },
        severity: "critical",
        channels: [{ type: "rollbar", config: { level: "critical" } }],
        enabled: true,
      },
      {
        id: "payment_service_degraded",
        name: "Payment Service Degraded",
        condition: {
          metric: "stripe_health",
          operator: "eq",
          threshold: 0,
          timeWindow: 300,
        },
        severity: "warning",
        channels: [{ type: "rollbar", config: { level: "warning" } }],
        enabled: true,
      },
      {
        id: "high_response_time",
        name: "High Average Response Time",
        condition: {
          metric: "avg_response_time",
          operator: "gt",
          threshold: 2000, // 2 seconds
          timeWindow: 300,
        },
        severity: "warning",
        channels: [{ type: "rollbar", config: { level: "warning" } }],
        enabled: true,
      },
      {
        id: "error_rate_spike",
        name: "Error Rate Spike",
        condition: {
          metric: "error_rate",
          operator: "gt",
          threshold: 5, // 5%
          timeWindow: 300,
        },
        severity: "critical",
        channels: [{ type: "rollbar", config: { level: "critical" } }],
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Health-Check-Ergebnisse evaluieren und Alerts triggern
   */
  public async evaluateHealthChecks(healthData: unknown): Promise<void> {
    const metrics = this.extractMetrics(healthData);

    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      const shouldTrigger = this.evaluateCondition(rule.condition, metrics);
      const existingAlert = this.activeAlerts.get(ruleId);

      if (shouldTrigger && !existingAlert) {
        // Neuen Alert triggern
        await this.triggerAlert(rule, metrics);
      } else if (!shouldTrigger && existingAlert) {
        // Alert auflösen
        await this.resolveAlert(ruleId);
      }
    }
  }

  /**
   * Metriken aus Health-Check-Daten extrahieren
   */
  private extractMetrics(healthData: unknown): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Service Health zu numerischen Werten konvertieren
    if (
      healthData &&
      typeof healthData === "object" &&
      "services" in healthData
    ) {
      const services = (healthData as { services?: unknown }).services;
      if (services && typeof services === "object") {
        Object.entries(services).forEach(([service, check]) => {
          if (check && typeof check === "object") {
            const status = (check as { status?: string }).status;
            const responseTime = (check as { responseTime?: number })
              .responseTime;
            metrics[`${service}_health`] = status === "pass" ? 1 : 0;
            metrics[`${service}_response_time`] = responseTime || 0;
          }
        });
      }
    }

    // Durchschnittliche Response Time
    const responseTimes = Object.keys(metrics)
      .filter((key) => key.endsWith("_response_time"))
      .map((key) => metrics[key]);

    if (responseTimes.length > 0) {
      metrics.avg_response_time =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Error Rate (vereinfacht)
    const failedServices = Object.keys(metrics).filter(
      (key) => key.endsWith("_health") && metrics[key] === 0,
    ).length;
    const totalServices = Object.keys(metrics).filter((key) =>
      key.endsWith("_health"),
    ).length;

    if (totalServices > 0) {
      metrics.error_rate = (failedServices / totalServices) * 100;
    }

    return metrics;
  }

  /**
   * Alert-Bedingung evaluieren
   */
  private evaluateCondition(
    condition: AlertCondition,
    metrics: Record<string, number>,
  ): boolean {
    const value = metrics[condition.metric];
    if (value === undefined) return false;

    switch (condition.operator) {
      case "gt":
        return value > condition.threshold;
      case "lt":
        return value < condition.threshold;
      case "eq":
        return value === condition.threshold;
      case "ne":
        return value !== condition.threshold;
      case "gte":
        return value >= condition.threshold;
      case "lte":
        return value <= condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Alert triggern
   */
  private async triggerAlert(
    rule: AlertRule,
    metrics: Record<string, number>,
  ): Promise<void> {
    const alertId = `${rule.id}_${Date.now()}`;
    const alert: DeploymentAlert = {
      id: alertId,
      ruleId: rule.id,
      timestamp: new Date().toISOString(),
      severity: rule.severity,
      message: `Deployment Alert: ${rule.name}`,
      details: {
        rule: rule.name,
        condition: rule.condition,
        currentValue: metrics[rule.condition.metric],
        threshold: rule.condition.threshold,
        metrics,
      },
      resolved: false,
    };

    this.activeAlerts.set(rule.id, alert);

    // An alle konfigurierten Kanäle senden
    for (const channel of rule.channels) {
      await this.sendNotification(channel, alert);
    }

    // Analytics tracken
    analytics.trackEvent(alertId, "deployment_alert_triggered", {
      ruleId: rule.id,
      severity: rule.severity,
      metric: rule.condition.metric,
      value: metrics[rule.condition.metric],
      threshold: rule.condition.threshold,
    });
  }

  /**
   * Alert auflösen
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (!alert) return;

    alert.resolved = true;
    this.activeAlerts.delete(ruleId);

    // Auflösung an Rollbar melden
    serverInstance.info("Deployment Alert Resolved", {
      alertId: alert.id,
      ruleId: alert.ruleId,
      resolvedAt: new Date().toISOString(),
      duration: Date.now() - new Date(alert.timestamp).getTime(),
    });

    // Analytics tracken
    analytics.trackEvent(`${alert.id}_resolved`, "deployment_alert_resolved", {
      ruleId: alert.ruleId,
      severity: alert.severity,
      duration: Date.now() - new Date(alert.timestamp).getTime(),
    });
  }

  /**
   * Benachrichtigung senden
   */
  private async sendNotification(
    channel: NotificationChannel,
    alert: DeploymentAlert,
  ): Promise<void> {
    switch (channel.type) {
      case "rollbar": {
        const level = channel.config.level || "error";

        if (level === "critical") {
          serverInstance.critical(
            alert.message,
            alert.details as Record<string, unknown>,
          );
        } else if (level === "warning") {
          serverInstance.warning(
            alert.message,
            alert.details as Record<string, unknown>,
          );
        } else {
          serverInstance.error(
            alert.message,
            alert.details as Record<string, unknown>,
          );
        }
        break;
      }

      case "webhook":
        // Webhook-Implementation hier
        break;

      case "email":
        // E-Mail-Implementation hier
        break;
    }
  }

  /**
   * Aktive Alerts abrufen
   */
  public getActiveAlerts(): DeploymentAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Alert-Regel hinzufügen oder aktualisieren
   */
  public setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Alert-Regel entfernen
   */
  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.activeAlerts.delete(ruleId);
  }
}

// Singleton-Instanz exportieren
export const deploymentAlerts = DeploymentAlertSystem.getInstance();
