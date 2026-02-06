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
import type {
  AdminReportsResponse,
  HealthStatus,
  ServiceHealth,
} from '@/lib/types/admin';

function ServiceHealthChip({ service }: { service: ServiceHealth }) {
  const statusColor =
    service.status === 'healthy'
      ? 'success'
      : service.status === 'degraded'
        ? 'warning'
        : 'error';

  return (
    <Chip
      label={`${service.nameDe}: ${service.status}`}
      color={statusColor}
      size='small'
      sx={{ mr: 1, mb: 1 }}
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
      breadcrumbs={[{ label: ADMIN_LABELS.reports, href: '/admin/reports' }]}
      titleProps={{ 'data-testid': 'admin-reports-page' }}
    >
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Overview Stats */}
      <Card sx={{ mb: 4 }}>
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
      <Card sx={{ mb: 4 }}>
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
                value={bookings?.byStatus.CONFIRMED ?? 0}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard
                title='Ausstehend'
                value={bookings?.byStatus.PENDING ?? 0}
              />
            </Grid>
          </Grid>
          {bookings?.revenue.total !== undefined && (
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
      <Card sx={{ mb: 4 }}>
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
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Benutzer-Wachstum
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
      <Card>
        <CardContent>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ mb: 2 }}
          >
            <Typography variant='h6'>System-Health</Typography>
            <Button
              variant='outlined'
              size='small'
              startIcon={
                healthLoading ? <CircularProgress size={16} /> : <RefreshIcon />
              }
              onClick={handleRefreshHealth}
              disabled={healthLoading}
              data-testid='refresh-health-button'
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
                  label={health.overall}
                  color={
                    health.overall === 'healthy'
                      ? 'success'
                      : health.overall === 'degraded'
                        ? 'warning'
                        : 'error'
                  }
                  size='small'
                />
              </Box>

              <Typography variant='body2' component='span' sx={{ mr: 1 }}>
                Services:
              </Typography>
              <Box sx={{ mb: 2 }}>
                <ServiceHealthChip service={health.services.database} />
                <ServiceHealthChip service={health.services.clerk} />
                <ServiceHealthChip service={health.services.stripe} />
                <ServiceHealthChip service={health.services.rollbar} />
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
