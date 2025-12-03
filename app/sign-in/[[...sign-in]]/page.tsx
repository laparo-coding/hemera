'use client';

import { SignIn } from '@clerk/nextjs';
import { Box, Container, Paper } from '@mui/material';
import { useSearchParams } from 'next/navigation';

// Design tokens from Hemera spec
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
};

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url') || '/dashboard';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth='sm'>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '16px',
            border: '1px solid',
            borderColor: 'rgba(22, 64, 77, 0.1)',
            boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <SignIn
              redirectUrl={redirectUrl}
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
                  rootBox: {
                    width: '100%',
                  },
                  card: {
                    width: '100%',
                    boxShadow: 'none',
                    border: 'none',
                  },
                  headerTitle: {
                    fontFamily: '"Playfair Display", serif',
                    color: colors.petrol,
                    fontSize: '1.75rem',
                  },
                  headerSubtitle: {
                    fontFamily: '"Inter", sans-serif',
                    color: colors.petrol,
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
        </Paper>
      </Container>
    </Box>
  );
}
