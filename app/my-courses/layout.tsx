/**
 * My Courses Layout
 *
 * Protected layout for user course pages
 * with Clerk authentication and navigation.
 */

import { Box } from '@mui/material';
import type { Metadata } from 'next';
import { PublicNavigation } from '../../components/navigation/PublicNavigation';
import { requireAuthenticatedUser } from '../../lib/auth/helpers';

export const metadata: Metadata = {
  title: 'Meine Seminare | Hemera',
  description: 'Deine gebuchten Seminare und Vorbereitungsmaterialien',
};

export default async function MyCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedUser();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavigation />

      <Box component='main' sx={{ paddingTop: '64px', flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
