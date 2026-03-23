import { requireAuthenticatedUser } from '../../lib/auth/helpers';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box, Typography } from '@mui/material';
import type { Metadata } from 'next';
import { colors } from '@/lib/design-tokens';
import { MyCoursesClient } from './MyCoursesClient';

export const metadata: Metadata = {
  title: 'Meine Seminare - Hemera Academy',
  description:
    'Verwalte deine gebuchten Seminare und verfolge deinen Fortschritt',
};

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
        sx={{ color: colors.marsala, fontWeight: 600, mb: 1 }}
      >
        Meine Seminare
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Verfolge den Fortschritt deines Seminars
      </Typography>

      <MyCoursesClient userId={user.id} />
    </Box>
  );
}
