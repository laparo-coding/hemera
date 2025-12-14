import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/helpers';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Hemera Academy',
  description: 'Administrative dashboard for managing the platform',
};

export default async function AdminPage() {
  // This will redirect non-admin users to /dashboard
  const adminUser = await requireAdmin();

  return (
    <Box data-testid='admin-page'>
      <Typography variant='h4' component='h1' gutterBottom>
        Admin Dashboard
      </Typography>

      <Alert severity='info' sx={{ mb: 3 }}>
        Welcome to the administrative area. You have full access to platform
        management features.
      </Alert>

      <Grid container spacing={3}>
        {/* Platform Stats */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Platform Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='primary'>
                      1
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Users
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='primary'>
                      3
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Total Courses
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='primary'>
                      0
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Active Enrollments
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='h4' color='success.main'>
                      Online
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      System Status
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Info */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Admin Information
              </Typography>
              <Typography variant='body2' paragraph>
                <strong>Admin:</strong>{' '}
                {adminUser.emailAddresses[0]?.emailAddress || 'Unknown'}
              </Typography>
              <Typography variant='body2' paragraph>
                <strong>Role:</strong> Administrator
              </Typography>
              <Typography variant='body2' suppressHydrationWarning>
                <strong>Last Login:</strong> {new Date().toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                User Management
              </Typography>
              <Typography variant='body2' color='text.secondary' paragraph>
                Manage user accounts, roles, and permissions.
              </Typography>
              <Button variant='outlined' disabled fullWidth>
                Manage Users (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Course Management
              </Typography>
              <Typography variant='body2' color='text.secondary' paragraph>
                Create, edit, and manage course content.
              </Typography>
              <Button variant='outlined' disabled fullWidth>
                Manage Courses (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                System Settings
              </Typography>
              <Typography variant='body2' color='text.secondary' paragraph>
                Configure platform settings and preferences.
              </Typography>
              <Button variant='outlined' disabled fullWidth>
                System Settings (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Reports & Analytics
              </Typography>
              <Typography variant='body2' color='text.secondary' paragraph>
                View detailed reports and platform analytics.
              </Typography>
              <Button variant='outlined' disabled fullWidth>
                View Reports (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
