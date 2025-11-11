export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import CustomSignUpClient from '@/components/auth/CustomSignUpClient';

export default function CustomSignUpPage() {
  return (
    <Suspense
      fallback={
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='50vh'
        >
          <CircularProgress />
        </Box>
      }
    >
      <CustomSignUpClient />
    </Suspense>
  );
}
