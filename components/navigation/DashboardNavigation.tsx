'use client';

import { UserButton } from '@clerk/nextjs';
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { colors, typography } from '@/lib/design-tokens';
import { TERMS } from '../../lib/constants/terminology';

export function DashboardNavigation() {
  return (
    <AppBar
      position='static'
      elevation={0}
      sx={{
        bgcolor: colors.rosyBrown,
        borderBottom: `1px solid ${colors.marsalaDark}`,
      }}
    >
      <Container maxWidth='lg'>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo/Brand */}
          <Link href='/dashboard' style={{ textDecoration: 'none' }}>
            <Typography
              variant='h5'
              component='div'
              sx={{
                fontFamily: typography.heading,
                fontWeight: 700,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                color: colors.white,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Hemera Academy
            </Typography>
          </Link>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              component={Link}
              href='/dashboard'
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
              Dashboard
            </Button>

            <Button
              component={Link}
              href='/my-courses'
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
              {TERMS.myCourses}
            </Button>

            <Button
              component={Link}
              href='/courses'
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
              {TERMS.courses}
            </Button>

            <UserButton
              afterSignOutUrl='/'
              appearance={{
                elements: {
                  avatarBox: {
                    width: '32px',
                    height: '32px',
                  },
                  modalBackdrop: {
                    backgroundColor: 'transparent',
                  },
                },
              }}
              userProfileMode='modal'
              showName={false}
              data-testid='user-profile-button'
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
