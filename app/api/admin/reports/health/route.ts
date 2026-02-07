/**
 * Admin Health Status API Route
 * Feature: 024-admin-dashboard
 *
 * GET /api/admin/reports/health - Returns system health status
 */

import { getHealthStatus } from '@/lib/api/admin-reports';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';

export const OPTIONS = adminOptions;

export const GET = createAdminHandler(async () => getHealthStatus(), {
  context: 'AdminReports.Health.GET',
  errorMessage: 'Fehler beim Abrufen des Systemstatus',
});
