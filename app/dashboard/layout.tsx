'use client';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useAuth, useUser } from '@clerk/nextjs';
import { Box, Container, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { ClerkAvailabilityContext } from '../../components/auth/ClerkProviderWrapper';
import { isEnvFlagEnabled } from '../../lib/utils/env-flags';

const isE2EFlagEnabled = isEnvFlagEnabled(
  process.env.NEXT_PUBLIC_DISABLE_CLERK
);

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
    </Box>
  );
}

function DashboardLayoutE2E({ children }: { children: React.ReactNode }) {
  const _pathname = usePathname() || '/';
  const router = useRouter();
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  useLayoutEffect(() => {
    const readRole = () => {
      try {
        const raw =
          typeof window !== 'undefined' &&
          window.localStorage.getItem('clerk-session');
        if (raw) {
          const parsed = JSON.parse(raw as string);
          const role =
            (parsed?.user?.role as string | undefined) ||
            (parsed?.role as string | undefined) ||
            'user';
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
    </Box>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clerkBypassed } = useContext(ClerkAvailabilityContext);
  const allowMockSessionFallback =
    process.env.NEXT_PUBLIC_ENABLE_MOCK_SESSION === '1';
  const [hasMockSession, setHasMockSession] = useState(() => {
    if (
      isE2EFlagEnabled ||
      !allowMockSessionFallback ||
      typeof window === 'undefined'
    ) {
      return false;
    }

    return window.localStorage.getItem('clerk-session') !== null;
  });

  useEffect(() => {
    if (isE2EFlagEnabled || !allowMockSessionFallback) {
      return;
    }

    try {
      setHasMockSession(Boolean(window.localStorage?.getItem('clerk-session')));
    } catch {
      setHasMockSession(false);
    }
  }, [allowMockSessionFallback]);

  if (clerkBypassed && !isE2EFlagEnabled && !hasMockSession) {
    return (
      <Container component='main' maxWidth='lg' sx={{ py: 6 }}>
        <Typography>Dashboard ist vorubergehend nicht verfugbar.</Typography>
      </Container>
    );
  }

  const isE2E = isE2EFlagEnabled || hasMockSession;

  return isE2E ? (
    <DashboardLayoutE2E>{children}</DashboardLayoutE2E>
  ) : (
    <DashboardLayoutClerk>{children}</DashboardLayoutClerk>
  );
}
