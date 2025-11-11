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

export function DashboardNavigation() {
  return (
    <AppBar position='static' color='default' elevation={1}>
      <Container maxWidth='lg'>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo/Brand */}
          <Link href='/dashboard' style={{ textDecoration: 'none' }}>
            <Typography
              variant='h5'
              component='div'
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                cursor: 'pointer',
              }}
            >
              Hemera Academy
            </Typography>
          </Link>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              color='inherit'
              component={Link}
              href='/dashboard'
              sx={{ textTransform: 'none' }}
            >
              Dashboard
            </Button>

            <Button
              color='inherit'
              component={Link}
              href='/my-courses'
              sx={{ textTransform: 'none' }}
            >
              My Courses
            </Button>

            <Button
              color='inherit'
              component={Link}
              href='/courses'
              sx={{ textTransform: 'none' }}
            >
              Browse Courses
            </Button>

            <UserButton
              afterSignOutUrl='/'
              appearance={{
                elements: {
                  avatarBox: {
                    width: '32px',
                    height: '32px',
                  },
                },
              }}
              showName={false}
              data-testid='user-profile-button'
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
