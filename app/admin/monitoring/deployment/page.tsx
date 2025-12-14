/**
 * Admin Dashboard für Deployment Monitoring
 * Zeigt Echtzeit-Health-Status und Deployment-Metriken
 */

import type { Metadata } from 'next';
import DeploymentMonitoringDashboard from '../../../../components/monitoring/DeploymentMonitoringDashboard';

export const metadata: Metadata = {
  title: 'Deployment Monitoring | Hemera Admin',
  description: 'Überwachung von Deployment-Status und Service-Health',
};

export default function DeploymentMonitoringPage() {
  return <DeploymentMonitoringDashboard />;
}
