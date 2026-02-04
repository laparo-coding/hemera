/**
 * Admin Dashboard Page
 * Feature: 024-admin-dashboard
 *
 * Main dashboard with 6 navigation cards in a 3-column grid.
 * Admin authentication is handled by the parent layout.
 */

import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { DashboardGrid } from '@/components/admin/DashboardGrid';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Hemera Academy',
  description: 'Administrative Dashboard für die Plattformverwaltung',
};

export default async function AdminPage() {
  return (
    <AdminPageContainer
      title='Admin Dashboard'
      breadcrumbs={[]}
      data-testid='admin-page'
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant='body1' color='text.secondary'>
          Willkommen im Administrationsbereich. Wähle einen Bereich zur
          Verwaltung.
        </Typography>
      </Box>

      <DashboardGrid />
    </AdminPageContainer>
  );
}
