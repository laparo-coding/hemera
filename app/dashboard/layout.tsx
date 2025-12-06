'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useAuth, useUser } from '@clerk/nextjs';
import { Box, Container, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

function DashboardLayoutClerk({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const _pathname = usePathname() || '/';

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <Box
      data-testid='dashboard-layout'
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/* Hidden user role for tests */}
      <span style={{ display: 'none' }} data-testid='user-role'>
        {(user?.publicMetadata?.role as string) || 'user'}
      </span>

      <Container
        component='main'
        maxWidth='lg'
        sx={{
          flexGrow: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          marginTop: { xs: '80px', sm: '80px' },
        }}
      >
        {children}
      </Container>

      <Box
        component='footer'
        sx={{
          mt: 'auto',
          py: 2,
          px: 3,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth='lg'>
          <Typography variant='body2' color='text.secondary' align='center'>
            © 2024 Hemera Academy. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

function DashboardLayoutE2E({ children }: { children: React.ReactNode }) {
  const _pathname = usePathname() || '/';
  const router = useRouter();
  const [userRole, setUserRole] = useState<'user' | 'admin'>(() => {
    try {
      const raw =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('clerk-session');
      if (raw) {
        const parsed = JSON.parse(raw as string);
        const role = (parsed?.user?.role as string) || 'user';
        return role === 'admin' ? 'admin' : 'user';
      }
    } catch {
      // Ignore parsing errors, return default
    }
    return 'user';
  }); // Read role from localStorage and react to changes
  useEffect(() => {
    const readRole = () => {
      try {
        const raw =
          typeof window !== 'undefined' &&
          window.localStorage.getItem('clerk-session');
        if (raw) {
          const parsed = JSON.parse(raw as string);
          const role = (parsed?.user?.role as string) || 'user';
          setUserRole(role === 'admin' ? 'admin' : 'user');
          return;
        }
      } catch {
        // Ignore parsing errors
      }
      setUserRole('user');
    };
    // Initial read before first paint
    // (in SSR window is undefined; in this effect we are on the client)
    readRole();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clerk-session') {
        readRole();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Safety: set role before first paint if data is present
  useLayoutEffect(() => {
    try {
      const raw = window.localStorage.getItem('clerk-session');
      if (raw) {
        const parsed = JSON.parse(raw as string);
        const role = (parsed?.user?.role as string) || 'user';
        setUserRole(role === 'admin' ? 'admin' : 'user');
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);
  const handleSignOut = useCallback(() => {
    try {
      // Clear local mock session
      window.localStorage.removeItem('clerk-session');
      // Clear other storage
      localStorage.clear();
      sessionStorage.clear();
      // Basic cookie clear
      const cookies = document.cookie.split(';');
      cookies.forEach(c => {
        const cookieName = c.replace(/^ +/, '').replace(/=.*/, '');
        document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
      });
    } catch {
      // Ignore cookie clearing errors
    }
    router.push('/');
  }, [router]);
  return (
    <Box
      data-testid='dashboard-layout'
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/* Hidden user role for tests */}
      <span style={{ display: 'none' }} data-testid='user-role'>
        {userRole}
      </span>
      {/* Hidden sign-out button for E2E tests */}
      <button
        style={{ display: 'none' }}
        data-testid='sign-out-button'
        onClick={handleSignOut}
      >
        Sign out
      </button>

      <Container
        component='main'
        maxWidth='lg'
        sx={{
          flexGrow: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          marginTop: { xs: '80px', sm: '80px' },
        }}
      >
        {children}
      </Container>

      <Box
        component='footer'
        sx={{
          mt: 'auto',
          py: 2,
          px: 3,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth='lg'>
          <Typography variant='body2' color='text.secondary' align='center'>
            © 2024 Hemera Academy. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Determine E2E mode on the client:
  // - Prefer public env flag NEXT_PUBLIC_DISABLE_CLERK=1
  // - Fallback: detect presence of mocked clerk-session in localStorage (set by tests)
  let isE2E = false;
  try {
    // Public env flag available on client
    if (process.env.NEXT_PUBLIC_DISABLE_CLERK === '1') {
      isE2E = true;
    } else if (typeof window !== 'undefined') {
      const raw = window.localStorage?.getItem('clerk-session');
      if (raw) isE2E = true;
    }
  } catch {
    // Ignore localStorage errors
  }

  return isE2E ? (
    <DashboardLayoutE2E>{children}</DashboardLayoutE2E>
  ) : (
    <DashboardLayoutClerk>{children}</DashboardLayoutClerk>
  );
}
