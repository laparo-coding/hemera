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
  const shouldRenderClerkSignUp =
    process.env.NEXT_PUBLIC_E2E_TEST !== '1' &&
    process.env.NEXT_PUBLIC_DISABLE_CLERK !== '1';
  const [hydrated, setHydrated] = useState(false);
  const clerkReady = hydrated && shouldRenderClerkSignUp;

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
        px: 2,
        pt: { xs: 10, md: 14 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <AuthPageFallback
        mode='sign-up'
        hydrated={hydrated}
        showFallback={!clerkReady}
      />
      {clerkReady ? <SignUp appearance={authPageClerkAppearance} /> : null}
    </Box>
  );
}
