'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AuthPageFallback } from '@/components/auth/AuthPageFallback';
import { authPageClerkAppearance } from '@/components/auth/clerkAppearance';
import { colors } from '@/lib/design-tokens';

const SignIn = dynamic(
  () => import('@clerk/nextjs').then(module => module.SignIn),
  { ssr: false }
);

type SignInPageClientProps = {
  redirectUrl: string;
};

export function SignInPageClient({ redirectUrl }: SignInPageClientProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <Box
      data-testid='sign-in-page-shell'
      sx={{
        minHeight: '100vh',
        bgcolor: colors.beige,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, md: 16 },
      }}
    >
      <AuthPageFallback mode='sign-in' hydrated={hydrated} />
      {hydrated ? (
        <SignIn
          forceRedirectUrl={redirectUrl}
          signUpUrl='/sign-up'
          appearance={authPageClerkAppearance}
        />
      ) : null}
    </Box>
  );
}
