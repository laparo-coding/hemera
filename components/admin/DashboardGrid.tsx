'use client';

/**
 * DashboardGrid Component
 * Feature: 024-admin-dashboard
 *
 * Responsive 3-column grid displaying dashboard navigation cards.
 */

import Grid from '@mui/material/Grid';
import { ADMIN_LAYOUT, DASHBOARD_CARDS } from '@/lib/constants/admin';
import { DashboardCard } from './DashboardCard';

export function DashboardGrid() {
  return (
    <Grid
      container
      spacing={ADMIN_LAYOUT.GRID_SPACING}
      data-testid='admin-dashboard-grid'
    >
      {DASHBOARD_CARDS.map(card => (
        <Grid
          key={card.id}
          size={{
            xs: 12, // Full width on mobile
            sm: 6, // 2 columns on tablet
            md: 4, // 3 columns on desktop
          }}
        >
          <DashboardCard config={card} />
        </Grid>
      ))}
    </Grid>
  );
}
