import { requireAuthenticatedUser } from '../../lib/auth/helpers';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { MyCoursesClient } from './MyCoursesClient';

export const metadata: Metadata = {
  title: 'Meine Kurse - Hemera Academy',
  description:
    'Verwalte deine gebuchten Kurse und verfolge deinen Fortschritt',
};

// Design tokens
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
} as const;

export default async function MyCoursesPage() {
  const user = await requireAuthenticatedUser();

  return (
    <Box
      data-testid='my-courses-page'
      sx={{
        maxWidth: 900,
        mx: 'auto',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Typography
        variant='h4'
        component='h1'
        sx={{ color: colors.petrol, fontWeight: 600, mb: 1 }}
      >
        Meine Kurse
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Verfolge deinen Fortschritt und schließe deine Kurse ab.
      </Typography>

      <MyCoursesClient userId={user.id} />
    </Box>
  );
}
