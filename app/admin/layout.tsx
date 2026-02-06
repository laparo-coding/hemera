/**
 * Admin Layout
 * Feature: 024-admin-dashboard
 *
 * Protected layout for admin section
 * with Clerk authentication and role check.
 * Uses standardized 1280px max-width (lg).
 */

import { currentUser } from '@clerk/nextjs/server';
import { Box, Container } from '@mui/material';
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

  // ThemeRegistry ist ein Client Component Wrapper für MUI SSR/CSR-Styling
  const ThemeRegistry = (await import('../../components/ThemeRegistry'))
    .default;
  return (
    <ThemeRegistry>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <PublicNavigation />

        <Box component='main' sx={{ paddingTop: '64px', flexGrow: 1 }}>
          <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
            {children}
          </Container>
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
