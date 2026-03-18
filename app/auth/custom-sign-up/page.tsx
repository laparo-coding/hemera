export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import { colors } from '@/lib/design-tokens';
import CustomSignUpClient from '../../../components/auth/CustomSignUpClient';

export default function CustomSignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.beige,
      }}
    >
      <Suspense
        fallback={
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='100vh'
            bgcolor={colors.beige}
          >
            <CircularProgress
              aria-label='Laden'
              sx={{ color: colors.marsala }}
            />
          </Box>
        }
      >
        <CustomSignUpClient />
      </Suspense>
    </Box>
  );
}
