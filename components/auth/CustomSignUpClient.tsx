'use client';

import { useSignUp } from '@clerk/nextjs';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';

// Design tokens from Hemera spec
const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
};

export default function CustomSignUpClient() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState('');

  const redirectTo = useMemo(
    () => params?.get('redirect_url') || '/dashboard',
    [params]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerifying(true);
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      const message =
        error?.errors?.[0]?.message || 'Sign-up failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });
      if (complete.status === 'complete') {
        await setActive?.({ session: complete.createdSessionId });
        router.push(redirectTo);
      } else {
        setError(
          'Verification not complete. Please check the code and try again.'
        );
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> };
      const message =
        error?.errors?.[0]?.message || 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

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
          }}
        >
          <Box
            component='form'
            onSubmit={isVerifying ? onVerify : onSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div id='clerk-captcha'></div>

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                component='h1'
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: { xs: '1.75rem', sm: '2rem' },
                  fontWeight: 700,
                  color: colors.petrol,
                  mb: 1,
                }}
              >
                {isVerifying ? 'E-Mail bestätigen' : 'Registrieren'}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '1rem',
                  color: colors.petrol,
                  opacity: 0.8,
                }}
              >
                {isVerifying
                  ? 'Wir haben dir einen Bestätigungscode per E-Mail gesendet.'
                  : 'Erstelle dein Konto bei der Hemera Akademie.'}
              </Typography>
            </Box>

            {error && (
              <Alert severity='error' sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}

            {!isVerifying ? (
              <>
                <TextField
                  type='email'
                  label='E-Mail'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete='email'
                  disabled={!isLoaded || submitting}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '&:hover fieldset': {
                        borderColor: colors.sage,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.petrol,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: colors.petrol,
                    },
                  }}
                />
                <TextField
                  type='password'
                  label='Passwort'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  disabled={!isLoaded || submitting}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '&:hover fieldset': {
                        borderColor: colors.sage,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.petrol,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: colors.petrol,
                    },
                  }}
                />
              </>
            ) : (
              <TextField
                type='text'
                label='Bestätigungscode'
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 6,
                }}
                disabled={!isLoaded || submitting}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover fieldset': {
                      borderColor: colors.sage,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.petrol,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: colors.petrol,
                  },
                }}
              />
            )}

            <Button
              type='submit'
              variant='contained'
              size='large'
              disabled={!isLoaded || submitting}
              fullWidth
              sx={{
                mt: 1,
                py: 1.5,
                bgcolor: colors.gold,
                color: colors.petrol,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: '#C99545',
                },
                '&:disabled': {
                  bgcolor: colors.sage,
                  color: colors.petrol,
                  opacity: 0.6,
                },
              }}
            >
              {isVerifying
                ? submitting
                  ? 'Wird bestätigt…'
                  : 'Bestätigen'
                : submitting
                  ? 'Wird erstellt…'
                  : 'Konto erstellen'}
            </Button>

            {/* Link to Sign In */}
            <Typography
              sx={{
                textAlign: 'center',
                mt: 2,
                fontFamily: '"Inter", sans-serif',
                fontSize: '0.875rem',
                color: colors.petrol,
              }}
            >
              Bereits registriert?{' '}
              <Box
                component='a'
                href='/sign-in'
                sx={{
                  color: colors.petrol,
                  fontWeight: 600,
                  textDecoration: 'underline',
                  '&:hover': {
                    color: colors.gold,
                  },
                }}
              >
                Anmelden
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
