'use client';

import { SignIn } from '@clerk/nextjs';
import { Box } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { colors } from '@/lib/design-tokens';

// Validate redirect URL to prevent open redirect attacks
function validateRedirectUrl(url: string | null): string {
  const defaultRedirect = '/dashboard';

  if (!url) return defaultRedirect;

  // Only allow relative paths starting with /
  if (!url.startsWith('/')) return defaultRedirect;

  // Prevent protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) return defaultRedirect;

  // Prevent javascript: and other protocols
  if (url.includes(':')) return defaultRedirect;

  return url;
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = validateRedirectUrl(searchParams?.get('redirect_url'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.beige,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, md: 16 },
      }}
    >
      <SignIn
        forceRedirectUrl={redirectUrl}
        signUpUrl='/sign-up'
        appearance={{
          variables: {
            colorPrimary: colors.marsala,
            colorTextOnPrimaryBackground: colors.beige,
            colorBackground: colors.white,
            colorInputBackground: colors.white,
            colorInputText: colors.marsala,
            borderRadius: '8px',
          },
          elements: {
            card: {
              boxShadow: 'none',
              border: 'none',
            },
            headerTitle: {
              fontFamily: '"Playfair Display", serif',
              color: colors.marsala,
              fontSize: '1.75rem',
            },
            headerSubtitle: {
              display: 'none', // Hide "weiter zu hemera-academy"
            },
            formButtonPrimary: {
              backgroundColor: colors.bronze,
              color: colors.marsala,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#C99545',
              },
            },
            formFieldInput: {
              borderRadius: '8px',
              borderColor: colors.rosyBrown,
              '&:focus': {
                borderColor: colors.marsala,
              },
            },
            footerActionLink: {
              color: colors.marsala,
              fontWeight: 600,
              '&:hover': {
                color: colors.bronze,
              },
            },
            socialButtonsBlockButton: {
              borderColor: colors.rosyBrown,
              color: colors.marsala,
              '&:hover': {
                borderColor: colors.marsala,
                backgroundColor: 'rgba(166, 205, 198, 0.1)',
              },
            },
            dividerLine: {
              backgroundColor: colors.rosyBrown,
            },
            dividerText: {
              color: colors.marsala,
            },
          },
        }}
      />
    </Box>
  );
}
