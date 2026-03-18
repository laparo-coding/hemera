'use client';

import { SignUp } from '@clerk/nextjs';
import { Box } from '@mui/material';
import { colors } from '@/lib/design-tokens';

export default function SignUpPage() {
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
      <SignUp
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
              display: 'none',
            },
            formButtonPrimary: {
              backgroundColor: colors.bronze,
              color: colors.marsala,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: colors.bronzeHover,
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
