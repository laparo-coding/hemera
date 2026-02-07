/**
 * Admin Reports Stats API Route
 * Feature: 024-admin-dashboard
 *
 * GET /api/admin/reports/stats - Returns dashboard statistics
 */

import { getAdminReports } from '@/lib/api/admin-reports';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';

export const OPTIONS = adminOptions;

export const GET = createAdminHandler(async () => getAdminReports(), {
  context: 'AdminReports.Stats.GET',
  errorMessage: 'Berichte konnten nicht abgerufen werden',
});
