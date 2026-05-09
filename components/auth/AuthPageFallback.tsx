import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { authForm, colors, typography } from '@/lib/design-tokens';

type AuthPageFallbackProps = {
  mode: 'sign-in' | 'sign-up';
  hydrated: boolean;
  showFallback?: boolean;
};

const srOnlyStyles = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

export function AuthPageFallback({
  mode,
  hydrated,
  showFallback = !hydrated,
}: AuthPageFallbackProps) {
  if (!showFallback) {
    return (
      <Box
        component='span'
        role='status'
        aria-live='polite'
        data-testid='auth-page-ready'
        data-state={hydrated ? 'ready' : 'loading'}
        sx={srOnlyStyles}
      >
        {hydrated
          ? 'Authentifizierungsformular ist bereit.'
          : 'Authentifizierungsformular wird geladen.'}
      </Box>
    );
  }

  const isSignIn = mode === 'sign-in';
  const title = isSignIn ? 'Anmelden' : 'Registrieren';
  const description = isSignIn
    ? 'Das Anmeldeformular wird geladen. Du kannst alternativ direkt zur Registrierung oder zurück zur Startseite wechseln.'
    : 'Das Registrierungsformular wird geladen. Du kannst alternativ direkt zur Anmeldung oder zurück zur Startseite wechseln.';
  const alternateHref = isSignIn ? '/sign-up' : '/sign-in';
  const alternateLabel = isSignIn ? 'Zur Registrierung' : 'Zur Anmeldung';

  return (
    <>
      <Box
        data-testid={mode === 'sign-in' ? 'sign-in-page' : 'sign-up-page'}
        data-auth-hydrated={hydrated ? 'true' : 'false'}
        sx={{
          width: '100%',
          maxWidth: authForm.cardMaxWidth,
          px: 2,
        }}
      >
        <Box
          component='section'
          aria-labelledby={`${mode}-fallback-title`}
          aria-describedby={`${mode}-fallback-description`}
          aria-busy='true'
          data-testid='auth-page-fallback'
          sx={{
            bgcolor: authForm.cardBackground,
            borderRadius: 2,
            boxShadow: authForm.cardShadow,
            p: { xs: 3, md: 4 },
          }}
        >
          <Stack spacing={2.5}>
            <Typography
              id={`${mode}-fallback-title`}
              component='h1'
              sx={{
                fontFamily: typography.heading,
                fontSize: { xs: '1.75rem', md: '2rem' },
                color: colors.marsala,
              }}
            >
              {title}
            </Typography>
            <Typography
              id={`${mode}-fallback-description`}
              sx={{
                color: colors.marsala,
                fontFamily: typography.body,
              }}
            >
              {description}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={Link}
                href={alternateHref}
                variant='outlined'
                sx={{
                  textTransform: 'none',
                  borderColor: colors.marsala,
                  color: colors.marsala,
                }}
              >
                {alternateLabel}
              </Button>
              <Button
                component={Link}
                href='/'
                variant='text'
                sx={{ textTransform: 'none', color: colors.marsala }}
              >
                Zur Startseite
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Box
        component='span'
        role='status'
        aria-live='polite'
        data-testid='auth-page-ready'
        data-state={hydrated ? 'ready' : 'loading'}
        sx={srOnlyStyles}
      >
        {hydrated
          ? 'Authentifizierungsformular ist bereit.'
          : 'Authentifizierungsformular wird geladen.'}
      </Box>
    </>
  );
}
