/**
 * Admin Layout
 * Feature: 024-admin-dashboard
 *
 * Protected layout for admin section
 * with Clerk authentication and role check.
 * Uses standardized 1280px max-width (lg).
 */

import { Box, Container } from '@mui/material';
import type { Metadata } from 'next';
import { AdminE2EAccessGate } from '@/components/admin/AdminE2EAccessGate';
import { requireAdmin } from '@/lib/auth/helpers';
import { isEnvFlagEnabled } from '@/lib/utils/env-flags';
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
  const isE2EMode =
    isEnvFlagEnabled(process.env.E2E_TEST) ||
    isEnvFlagEnabled(process.env.NEXT_PUBLIC_E2E_TEST) ||
    isEnvFlagEnabled(process.env.NEXT_PUBLIC_DISABLE_CLERK);

  if (!isE2EMode) {
    await requireAdmin();
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
            {isE2EMode ? (
              <AdminE2EAccessGate>{children}</AdminE2EAccessGate>
            ) : (
              children
            )}
          </Container>
        </Box>
      </Box>
    </ThemeRegistry>
  );
}
