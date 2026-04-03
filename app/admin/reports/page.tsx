'use client';

/**
 * Admin Reports Page
 * Feature: 024-admin-dashboard
 *
 * Reports & Analytics page with dashboard stats and manual health refresh.
 */

import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { AdminPageContainer } from '@/components/admin/AdminPageContainer';
import { ADMIN_LABELS } from '@/lib/constants/admin';
import { colors } from '@/lib/design-tokens';
import type {
  AdminReportsResponse,
  HealthStatus,
  HealthStatusLevel,
  ServiceHealth,
} from '@/lib/types/admin';

const STATUS_LABELS: Record<string, string> = {
  healthy: ADMIN_LABELS.healthy,
  degraded: ADMIN_LABELS.degraded,
  unhealthy: ADMIN_LABELS.unhealthy,
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const statusStyles = {
  healthy: {
    color: colors.statusHealthy,
    backgroundColor: colors.statusHealthyBg,
  },
  degraded: {
    color: colors.statusDegraded,
    backgroundColor: colors.statusDegradedBg,
  },
  unhealthy: {
    color: colors.statusUnhealthy,
    backgroundColor: colors.statusUnhealthyBg,
  },
} as const;

function getStatusStyle(status: HealthStatusLevel) {
  return statusStyles[status] ?? statusStyles.unhealthy;
}

function ServiceHealthChip({ service }: { service: ServiceHealth }) {
  const style = getStatusStyle(service.status);

  return (
    <Chip
      data-testid={`health-status-${service.name}`}
      label={`${service.nameDe}: ${getStatusLabel(service.status)}`}
      size='small'
      sx={{ fontWeight: 500, ...style }}
    />
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant='h4' color='primary' gutterBottom>
        {value}
      </Typography>
      <Typography variant='body1' fontWeight='medium'>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant='body2' color='text.secondary'>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AdminReportsResponse | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reports/stats');
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken');
      const data = await response.json();
      setReports(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const response = await fetch('/api/admin/reports/health');
      if (!response.ok) throw new Error('Fehler beim Laden des Health-Status');
      const data = await response.json();
      setHealth(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchHealth()]);
      setLoading(false);
    };
    loadData();
  }, [fetchReports, fetchHealth]);

  const handleRefreshHealth = () => {
    fetchHealth();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = reports?.stats;
  const bookings = reports?.bookings;
  const courseUtilization = reports?.courseUtilization ?? [];
  const userGrowth = reports?.userGrowth;

  // Calculate summary stats from utilization data
  const fullCourses = courseUtilization.filter(
    c => c.utilizationPercent >= 100
  ).length;
  const availableCourses = courseUtilization.filter(
    c => c.utilizationPercent < 100
  ).length;
  const avgUtilization =
    courseUtilization.length > 0
      ? courseUtilization.reduce((sum, c) => sum + c.utilizationPercent, 0) /
        courseUtilization.length
      : 0;

  return (
    <AdminPageContainer
      title={ADMIN_LABELS.reports}
      subtitle='Statistiken, Auslastung und Systemstatus auf einen Blick.'
      breadcrumbs={[{ label: ADMIN_LABELS.reports, href: '/admin/reports' }]}
      titleProps={{ 'data-testid': 'admin-reports-page' }}
    >
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Overview Stats */}
      <Card sx={{ mb: 4 }} data-testid='reports-overview-section'>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Übersicht
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Benutzer gesamt'
                value={stats?.totalUsers ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title='Kurse gesamt' value={stats?.totalCourses ?? 0} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Veröffentlichte Kurse'
                value={stats?.publishedCourses ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Buchungen gesamt'
                value={stats?.totalBookings ?? 0}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Booking Stats */}
      <Card sx={{ mb: 4 }} data-testid='reports-bookings-section'>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Buchungsstatistiken
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Letzte 7 Tage'
                value={bookings?.last7Days ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Letzte 30 Tage'
                value={bookings?.last30Days ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Bestätigt'
                value={bookings?.byStatus?.CONFIRMED ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Ausstehend'
                value={bookings?.byStatus?.PENDING ?? 0}
              />
            </Grid>
          </Grid>
          {bookings?.revenue?.total !== undefined && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' color='text.secondary'>
                Gesamtumsatz:{' '}
                <strong>
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(bookings.revenue.total / 100)}
                </strong>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Course Utilization */}
      <Card sx={{ mb: 4 }} data-testid='reports-utilization-section'>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Kursauslastung
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard
                title='Durchschn. Auslastung'
                value={`${Math.round(avgUtilization)}%`}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard title='Voll ausgebuchte Kurse' value={fullCourses} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <StatCard title='Mit freien Plätzen' value={availableCourses} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card sx={{ mb: 4 }} data-testid='reports-growth-section'>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Benutzerwachstum
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard title='Gesamt' value={userGrowth?.total ?? 0} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Administratoren'
                value={userGrowth?.admins ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Neue (30 Tage)'
                value={stats?.newUsersLast30Days ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Outperformer'
                value={userGrowth?.outperformers ?? 0}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Health Status */}
      <Card data-testid='reports-health-section'>
        <CardContent>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ mb: 2 }}
          >
            <Typography variant='h6'>{ADMIN_LABELS.systemStatus}</Typography>
            <Button
              variant='outlined'
              size='small'
              startIcon={
                healthLoading ? <CircularProgress size={16} /> : <RefreshIcon />
              }
              onClick={handleRefreshHealth}
              disabled={healthLoading}
              data-testid='health-refresh-button'
            >
              Aktualisieren
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {health && (
            <>
              <Box
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Typography
                  variant='body2'
                  color='text.secondary'
                  component='span'
                >
                  Gesamtstatus:
                </Typography>
                <Chip
                  label={getStatusLabel(health.overall)}
                  size='small'
                  sx={{ fontWeight: 500, ...getStatusStyle(health.overall) }}
                />
              </Box>

              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5,
                }}
              >
                <Typography variant='body2' component='span' sx={{ mr: 0.5 }}>
                  Dienste:
                </Typography>
                {Object.values(health.services).map(service => (
                  <ServiceHealthChip key={service.name} service={service} />
                ))}
              </Box>

              <Typography variant='body2' color='text.secondary'>
                Zuletzt aktualisiert:{' '}
                {new Date(health.lastChecked).toLocaleString('de-DE')}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </AdminPageContainer>
  );
}
