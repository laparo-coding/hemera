'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { authPageClerkAppearance } from '@/components/auth/clerkAppearance';
import { colors } from '@/lib/design-tokens';

const SignUp = dynamic(
  () => import('@clerk/nextjs').then(module => module.SignUp),
  { ssr: false }
);

export function SignUpPageClient() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <Box
      data-testid='sign-up-page-shell'
      sx={{
        minHeight: '100vh',
        bgcolor: colors.beige,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, md: 16 },
      }}
    >
      <AuthPageFallback mode='sign-up' hydrated={hydrated} />
      {hydrated && <SignUp appearance={authPageClerkAppearance} />}
    </Box>
  );
}
