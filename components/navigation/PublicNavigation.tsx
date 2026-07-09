'use client';

import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { userButtonClerkAppearance } from '@/components/auth/clerkAppearance';
import { colors, typography } from '@/lib/design-tokens';
import { TERMS } from '../../lib/constants/terminology';
import { SignedIn, SignedOut, UserButton } from '../auth/ClerkComponents';
import ClientOnly from '../ClientOnly';

type E2ESessionUserRole = 'user' | 'admin' | 'unknown';

function readE2ERole(): E2ESessionUserRole {
  if (typeof window === 'undefined') {
    return 'user';
  }

  try {
    const raw = window.localStorage.getItem('clerk-session');
    if (!raw) {
      return 'user';
    }

    const parsed = JSON.parse(raw);
    const role = parsed?.user?.role;

    if (role === 'admin' || role === 'user') {
      return role;
    }

    return 'unknown';
  } catch {
    return 'user';
  }
}

/**
 * Public navigation component for non-protected pages
 * Shows login/signup buttons for unauthenticated users
 * Shows user menu for authenticated users
 */
export function PublicNavigation({
  hideMyCourses = false,
}: {
  hideMyCourses?: boolean;
}) {
  const authNavButtons = (
    <Box
      data-testid='auth-nav-fallback'
      sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
    >
      <Button
        variant='outlined'
        component={Link}
        href='/sign-in'
        data-testid='nav-login-button'
        sx={{
          textTransform: 'none',
          px: 3,
          color: colors.white,
          borderColor: colors.white,
          fontFamily: typography.body,
          fontWeight: 500,
          '&:hover': {
            borderColor: colors.beige,
            bgcolor: colors.whiteOverlay15,
          },
        }}
      >
        Anmelden
      </Button>
      <Button
        variant='contained'
        component={Link}
        href='/sign-up'
        data-testid='nav-signup-button'
        sx={{
          textTransform: 'none',
          px: 3,
          bgcolor: colors.marsala,
          color: colors.white,
          fontFamily: typography.body,
          fontWeight: 600,
          '&:hover': {
            bgcolor: colors.marsalaDark,
          },
        }}
      >
        Registrieren
      </Button>
    </Box>
  );

  const authNavStatus = (state: 'loading' | 'ready', label: string) => (
    <Box
      component='span'
      role='status'
      aria-live='polite'
      data-testid='auth-nav-ready'
      data-state={state}
      sx={{
        position: 'absolute',
        width: 1,
        height: 1,
        p: 0,
        m: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {label}
    </Box>
  );

  const renderAuthNav = (state: 'loading' | 'ready', label: string) => (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {authNavButtons}
      {authNavStatus(state, label)}
    </Box>
  );

  // Check if Clerk is configured AND not disabled for E2E
  const isClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
  const isE2E =
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1' ||
    process.env.NEXT_PUBLIC_E2E_TEST === '1';
  const useClerk = isClerkConfigured && !isE2E;

  // In E2E mode, pick up mocked role from localStorage (set by tests/auth-helper)
  const [e2eRole, setE2eRole] = useState<E2ESessionUserRole>('user');
  useEffect(() => {
    if (!isE2E) return;
    const syncRole = () => {
      setE2eRole(readE2ERole());
    };
    syncRole();
    // subscribe to storage events so role changes reflect without reload
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clerk-session') syncRole();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [isE2E]);
  return (
    <AppBar
      position='fixed'
      elevation={0}
      sx={{
        zIndex: 1100,
        bgcolor: colors.rosyBrown,
        borderBottom: `1px solid ${colors.rosyBrown}`,
      }}
    >
      <Container maxWidth='lg'>
        <Toolbar
          disableGutters
          sx={{
            py: 1,
            px: { xs: 2, sm: 3 },
            minHeight: '64px !important',
            flexWrap: 'wrap',
            rowGap: 1,
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          {/* Logo/Brand */}
          <Link href='/' style={{ textDecoration: 'none' }}>
            <Typography
              component='div'
              sx={{
                fontFamily: `${typography.heading} !important`,
                fontWeight: '700 !important',
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                color: `${colors.white} !important`,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Hemera Academy
            </Typography>
          </Link>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation Links */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-end', sm: 'flex-start' },
              flexWrap: 'wrap',
              gap: 2,
              width: {
                xs: '100%',
                sm: 'auto',
              },
            }}
          >
            {/* Admin link visible in E2E mode when mocked as admin */}
            {/* Admin link visible in E2E mode when mocked as admin */}
            {isE2E && e2eRole === 'admin' && (
              <Button
                variant='text'
                component={Link}
                href='/admin'
                data-testid='nav-admin'
                sx={{
                  textTransform: 'none',
                  color: colors.white,
                  fontFamily: typography.body,
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: colors.whiteOverlay15,
                  },
                }}
              >
                Admin
              </Button>
            )}
            {/* Authentication Buttons - wrapped in ClientOnly to prevent hydration mismatch */}
            {useClerk ? (
              <ClientOnly
                fallback={renderAuthNav(
                  'loading',
                  'Kontonavigation wird geladen.'
                )}
              >
                <SignedOut>
                  {renderAuthNav('ready', 'Kontonavigation bereit.')}
                </SignedOut>

                {/* User Menu for Authenticated Users */}
                <SignedIn>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {!hideMyCourses && (
                      <Button
                        variant='text'
                        component={Link}
                        href='/dashboard'
                        sx={{
                          textTransform: 'none',
                          mr: 1,
                          color: colors.white,
                          fontFamily: typography.body,
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: colors.whiteOverlay15,
                          },
                        }}
                      >
                        {TERMS.myCourses}
                      </Button>
                    )}
                    <UserButton
                      appearance={userButtonClerkAppearance}
                      userProfileMode='modal'
                      data-testid='user-profile-button'
                    />
                    {authNavStatus('ready', 'Kontonavigation bereit.')}
                  </Box>
                </SignedIn>
              </ClientOnly>
            ) : (
              /* Fallback buttons when Clerk is not configured or E2E */
              renderAuthNav('ready', 'Kontonavigation bereit.')
            )}

            {/* Role indicator for tests in E2E mode */}
            {isE2E && (
              <span style={{ display: 'none' }} data-testid='user-role'>
                {e2eRole === 'unknown' ? 'user' : e2eRole}
              </span>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
