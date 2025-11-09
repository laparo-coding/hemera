/**
 * Deployment Monitoring Dashboard
 * Zeigt Health-Status und Deployment-Metriken in Echtzeit
 */

'use client';

import {
  CheckCircle as CheckCircleIcon,
  CloudDone as CloudDoneIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { useEffect, useState } from 'react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: unknown;
  lastChecked: string;
}

interface DeploymentStatus {
  version: string;
  deploymentId: string;
  timestamp: string;
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
}

interface HealthResponse {
  timestamp: string;
  requestId: string;
  deployment: DeploymentStatus;
  services: Record<string, HealthCheck>;
  summary: {
    overallStatus: string;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
  };
}

export default function DeploymentMonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/health/deployment', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data: HealthResponse = await response.json();
      setHealthData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const forceHealthCheck = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/health/deployment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'force_check' }),
      });

      if (!response.ok) {
        throw new Error(`Force check failed: ${response.status}`);
      }

      await fetchHealthStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchHealthStatus();

    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthStatus]);

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'success';
      case 'degraded':
      case 'warn':
        return 'warning';
      case 'unhealthy':
      case 'fail':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircleIcon color='success' />;
      case 'degraded':
      case 'warn':
        return <WarningIcon color='warning' />;
      case 'unhealthy':
      case 'fail':
        return <ErrorIcon color='error' />;
      default:
        return <TimelineIcon />;
    }
  };

  if (loading && !healthData) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant='h4' gutterBottom>
          <CloudDoneIcon sx={{ mr: 1 }} />
          Deployment Monitoring
        </Typography>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 1 }}>
          Lade Health-Status...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant='contained' onClick={fetchHealthStatus}>
          Erneut versuchen
        </Button>
      </Box>
    );
  }

  if (!healthData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='info'>Keine Health-Daten verfügbar</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant='h4'>
          <CloudDoneIcon sx={{ mr: 1 }} />
          Deployment Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={forceHealthCheck}
            disabled={loading}
          >
            Health Check
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Letztes Update: {lastUpdated}
          </Typography>
        </Box>
      </Box>

      {/* Gesamtstatus */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Deployment Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(healthData.deployment.status)}
                <Chip
                  label={healthData.deployment.status.toUpperCase()}
                  color={getStatusColor(healthData.deployment.status)}
                  variant='filled'
                />
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Version: {healthData.deployment.version} | Region:{' '}
                {healthData.deployment.region}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Service Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant='h4' color='success.main'>
                    {healthData.summary.passedChecks}
                  </Typography>
                  <Typography variant='caption'>Healthy</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='h4' color='warning.main'>
                    {healthData.summary.warningChecks}
                  </Typography>
                  <Typography variant='caption'>Warnings</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant='h4' color='error.main'>
                    {healthData.summary.failedChecks}
                  </Typography>
                  <Typography variant='caption'>Failed</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Service Health Details
          </Typography>

          {Object.entries(healthData.services).map(
            ([serviceName, healthCheck]) => (
              <Accordion key={serviceName} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    {getStatusIcon(healthCheck.status)}
                    <Typography
                      variant='subtitle1'
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {serviceName}
                    </Typography>
                    <Chip
                      label={healthCheck.status.toUpperCase()}
                      color={getStatusColor(healthCheck.status)}
                      size='small'
                    />
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ ml: 'auto' }}
                    >
                      {healthCheck.responseTime}ms
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary='Response Time'
                        secondary={`${healthCheck.responseTime}ms`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary='Last Checked'
                        secondary={new Date(
                          healthCheck.lastChecked
                        ).toLocaleString()}
                      />
                    </ListItem>
                    {healthCheck.details && (
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary='Details'
                          secondary={
                            <pre style={{ fontSize: '0.75rem', margin: 0 }}>
                              {JSON.stringify(healthCheck.details, null, 2)}
                            </pre>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            )
          )}
        </CardContent>
      </Card>

      {/* Deployment Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Deployment Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2'>Deployment ID</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontFamily: 'monospace' }}
              >
                {healthData.deployment.deploymentId}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2'>Request ID</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontFamily: 'monospace' }}
              >
                {healthData.requestId}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2'>Timestamp</Typography>
              <Typography variant='body2' color='text.secondary'>
                {new Date(healthData.deployment.timestamp).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2'>Check Timestamp</Typography>
              <Typography variant='body2' color='text.secondary'>
                {new Date(healthData.timestamp).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
