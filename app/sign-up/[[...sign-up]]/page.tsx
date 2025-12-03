'use client';

import { SignUp } from '@clerk/nextjs';
import { Box, Container, Paper, Typography } from '@mui/material';

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
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component='h1'
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontSize: { xs: '1.75rem', sm: '2rem' },
              fontWeight: 700,
              color: colors.petrol,
              mb: 1,
              textAlign: 'center',
            }}
          >
            Registriere dich bei Hemera
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '1rem',
              color: colors.petrol,
              opacity: 0.8,
              mb: 3,
              textAlign: 'center',
            }}
          >
            Erstelle dein Konto und beginne deine Lernreise noch heute
          </Typography>

          <Box
            data-testid='sign-up-card'
            sx={{
              width: '100%',
              '& .cl-rootBox': {
                width: '100%',
              },
              '& .cl-card': {
                boxShadow: 'none',
                border: 'none',
              },
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
                  rootBox: {
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                  },
                  card: {
                    boxShadow: 'none',
                    border: 'none',
                    backgroundColor: 'transparent',
                  },
                  headerTitle: {
                    display: 'none',
                  },
                  headerSubtitle: {
                    display: 'none',
                  },
                  socialButtonsBlockButton: {
                    borderRadius: '8px',
                    border: `1px solid ${colors.sage}`,
                    marginBottom: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.petrol,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(166, 205, 198, 0.1)',
                      borderColor: colors.petrol,
                    },
                  },
                  socialButtonsBlockButtonText: {
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.petrol,
                  },
                  dividerLine: {
                    backgroundColor: colors.sage,
                    height: '1px',
                  },
                  dividerText: {
                    color: colors.petrol,
                    fontSize: '14px',
                  },
                  formButtonPrimary: {
                    backgroundColor: colors.gold,
                    color: colors.petrol,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '12px',
                    '&:hover': {
                      backgroundColor: '#C99545',
                    },
                  },
                  formFieldInput: {
                    borderRadius: '8px',
                    border: `1px solid ${colors.sage}`,
                    fontSize: '14px',
                    padding: '12px',
                    '&:focus': {
                      borderColor: colors.petrol,
                      boxShadow: `0 0 0 1px ${colors.petrol}`,
                    },
                  },
                  footerActionLink: {
                    color: colors.petrol,
                    fontWeight: 600,
                    '&:hover': {
                      color: colors.gold,
                    },
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
