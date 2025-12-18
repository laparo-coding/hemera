/**
 * Admin Layout
 *
 * Protected layout for admin section
 * with Clerk authentication and role check.
 */

import { currentUser } from '@clerk/nextjs/server';
import { Box, Container, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PublicNavigation } from '../../components/navigation/PublicNavigation';

export const metadata: Metadata = {
  title: 'Admin-Dashboard | Hemera',
  description: 'Administrative Funktionen und Überwachung',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect=/admin');
  }

  const isAdmin = user.publicMetadata?.role === 'admin';

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavigation />

      <Box component='main' sx={{ paddingTop: '64px', flexGrow: 1 }}>
        <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
          {children}
        </Container>
      </Box>

      <Box
        component='footer'
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.200',
        }}
      >
        <Container maxWidth='xl'>
          <Typography variant='body2' color='text.secondary' align='center'>
            Admin-Bereich - Eingeschränkter Zugriff
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
