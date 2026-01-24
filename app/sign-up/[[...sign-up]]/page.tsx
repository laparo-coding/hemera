'use client';

import { SignUp } from '@clerk/nextjs';
import { Box } from '@mui/material';

// Design tokens from Hemera spec
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
};

export default function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.cream,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 12, md: 16 },
      }}
    >
      <SignUp
        appearance={{
          variables: {
            colorPrimary: colors.petrol,
            colorTextOnPrimaryBackground: colors.cream,
            colorBackground: '#FFFFFF',
            colorInputBackground: '#FFFFFF',
            colorInputText: colors.petrol,
            borderRadius: '8px',
          },
          elements: {
            card: {
              boxShadow: 'none',
              border: 'none',
            },
            headerTitle: {
              fontFamily: '"Playfair Display", serif',
              color: colors.petrol,
              fontSize: '1.75rem',
            },
            headerSubtitle: {
              display: 'none',
            },
            formButtonPrimary: {
              backgroundColor: colors.gold,
              color: colors.petrol,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#C99545',
              },
            },
            formFieldInput: {
              borderRadius: '8px',
              borderColor: colors.sage,
              '&:focus': {
                borderColor: colors.petrol,
              },
            },
            footerActionLink: {
              color: colors.petrol,
              fontWeight: 600,
              '&:hover': {
                color: colors.gold,
              },
            },
            socialButtonsBlockButton: {
              borderColor: colors.sage,
              color: colors.petrol,
              '&:hover': {
                borderColor: colors.petrol,
                backgroundColor: 'rgba(166, 205, 198, 0.1)',
              },
            },
            dividerLine: {
              backgroundColor: colors.sage,
            },
            dividerText: {
              color: colors.petrol,
            },
          },
        }}
      />
    </Box>
  );
}
