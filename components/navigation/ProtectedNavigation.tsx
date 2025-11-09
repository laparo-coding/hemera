import type { UserResource } from '@clerk/types';
import { Box, Tab, Tabs } from '@mui/material';
import Link from 'next/link';

interface ProtectedNavigationProps {
  'data-testid'?: string;
  user: UserResource;
}

const baseNavigation = [
  { label: 'Dashboard', route: '/dashboard', testId: 'nav-dashboard' },
  { label: 'Courses', route: '/courses', testId: 'nav-courses' },
  { label: 'Admin', route: '/admin', testId: 'nav-admin' }, // Filtered by role
];

/**
 * Main navigation for protected areas
 *
 * Provides tab-based navigation between different sections
 * of the protected application area with role-based visibility.
 */
export function ProtectedNavigation({
  'data-testid': testId,
  user,
}: ProtectedNavigationProps) {
  const userRole = (user.publicMetadata?.role as string) || 'user';

  // Filter navigation based on user role
  const availableNavigation = baseNavigation.filter(navItem => {
    if (navItem.route.includes('/admin') && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <Box
      data-testid={testId || 'protected-navigation'}
      sx={{
        position: 'fixed',
        top: 64, // Below the AppBar
        left: 0,
        right: 0,
        zIndex: 1100,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Tabs
        value={false} // Server component - no current path detection
        aria-label='protected area navigation'
        sx={{ minHeight: 48 }}
      >
        {availableNavigation.map(navItem => (
          <Tab
            key={navItem.route}
            label={navItem.label}
            value={navItem.route}
            component={Link}
            href={navItem.route}
            sx={{ minHeight: 48 }}
            data-testid={navItem.testId}
          />
        ))}
      </Tabs>
    </Box>
  );
}
