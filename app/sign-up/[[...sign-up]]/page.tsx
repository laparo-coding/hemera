'use client';

import { SignUp } from '@clerk/nextjs';
import { Box, Container, Paper, Typography } from '@mui/material';

export default function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        pt: 12,
      }}
    >
      <Container maxWidth='sm'>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component='h2'
            variant='h4'
            sx={{ mb: 3, fontWeight: 'bold' }}
          >
            Registriere dich bei Hemera
          </Typography>

          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ mb: 4, textAlign: 'center' }}
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
              '& .cl-socialButtonsBlockButton': {
                borderRadius: 2,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
              '& .cl-dividerLine': {
                backgroundColor: 'divider',
              },
            }}
          >
            <SignUp
              appearance={{
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
                  socialButtonsBlockButton: {
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    marginBottom: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                  },
                  socialButtonsBlockButtonText: {
                    fontSize: '14px',
                    fontWeight: 500,
                  },
                  dividerLine: {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                    height: '1px',
                  },
                  dividerText: {
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '14px',
                  },
                  formButtonPrimary: {
                    'data-testid': 'sign-up-button',
                    backgroundColor: '#1976d2',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '12px',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  },
                  formFieldInput: {
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    fontSize: '14px',
                    padding: '12px',
                    '&:focus': {
                      borderColor: '#1976d2',
                      boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.2)',
                    },
                    '&[name="emailAddress"]': {
                      'data-testid': 'email-input',
                    },
                    '&[name="password"]': {
                      'data-testid': 'password-input',
                    },
                    '&[name="firstName"]': {
                      'data-testid': 'first-name-input',
                    },
                    '&[name="lastName"]': {
                      'data-testid': 'last-name-input',
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
