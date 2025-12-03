export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { Box, CircularProgress } from '@mui/material';
import { Suspense } from 'react';
import CustomSignUpClient from '@/components/auth/CustomSignUpClient';

// Design tokens from Hemera spec
const colors = {
  cream: '#FBF5DD',
};

export default function CustomSignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.cream,
      }}
    >
      <Suspense
        fallback={
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='100vh'
            bgcolor={colors.cream}
          >
            <CircularProgress sx={{ color: '#16404D' }} />
          </Box>
        }
      >
        <CustomSignUpClient />
      </Suspense>
    </Box>
  );
}
