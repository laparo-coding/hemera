'use client';

import {
  AppBar,
  Box,
  Button,
  Container,
  Skeleton,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';
import { colors, typography } from '@/lib/design-tokens';
import { TERMS } from '../../lib/constants/terminology';
import { SignedIn, SignedOut, UserButton } from '../auth/ClerkComponents';
import ClientOnly from '../ClientOnly';

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
  // Check if Clerk is configured AND not disabled for E2E
  const isClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
  const isE2E = process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';
  const useClerk = isClerkConfigured && !isE2E;

  // In E2E mode, pick up mocked role from localStorage (set by tests/auth-helper)
  const [e2eRole, setE2eRole] = useState<'user' | 'admin' | 'unknown'>('user');
  useLayoutEffect(() => {
    if (!isE2E) return;
    const readRole = () => {
      try {
        const raw = window.localStorage.getItem('clerk-session');
        if (raw) {
          const parsed = JSON.parse(raw);
          const role = (parsed?.user?.role as string) || 'user';
          setE2eRole(
            role === 'admin' ? 'admin' : role === 'user' ? 'user' : 'unknown'
          );
          return;
        }
      } catch {
        // ignore
      }
      setE2eRole('user');
    };
    // initial read pre-paint
    readRole();
    // subscribe to storage events so role changes reflect without reload
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clerk-session') readRole();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                fallback={
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant='rounded' width={100} height={36} />
                    <Skeleton variant='rounded' width={110} height={36} />
                  </Box>
                }
              >
                <SignedOut>
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
                </SignedOut>

                {/* User Menu for Authenticated Users */}
                <SignedIn>
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
                    appearance={{
                      elements: {
                        avatarBox: {
                          width: '36px',
                          height: '36px',
                        },
                        userButtonPopoverCard: {
                          pointerEvents: 'initial',
                        },
                        modalBackdrop: {
                          backgroundColor: 'transparent',
                        },
                      },
                    }}
                    userProfileMode='modal'
                    data-testid='user-profile-button'
                  />
                </SignedIn>
              </ClientOnly>
            ) : (
              /* Fallback buttons when Clerk is not configured or E2E */
              <>
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
              </>
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
