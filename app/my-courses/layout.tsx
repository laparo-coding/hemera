/**
 * My Courses Layout
 *
 * Protected layout for user course pages
 * with Clerk authentication and navigation.
 */

import { currentUser } from '@clerk/nextjs/server';
import { Box } from '@mui/material';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PublicNavigation } from '../../components/navigation/PublicNavigation';

export const metadata: Metadata = {
  title: 'Meine Seminare | Hemera',
  description: 'Deine gebuchten Seminare und Vorbereitungsmaterialien',
};

export default async function MyCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in?redirect=/my-courses');
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavigation />

      <Box component='main' sx={{ paddingTop: '64px', flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
