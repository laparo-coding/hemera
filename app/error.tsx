'use client';

import { ErrorOutline, Refresh } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isRollbarDisabled =
    process.env.E2E_TEST === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
    process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '0';

  React.useEffect(() => {
    // Log the error to your error reporting service

    // Report error to Rollbar following official Next.js documentation
    if (!isRollbarDisabled) {
      import('rollbar')
        .then(Rollbar =>
          import('../lib/monitoring/rollbar-official').then(
            ({ clientConfig }) => {
              try {
                const rb = new Rollbar.default(clientConfig);
                rb.error(error);
              } catch {
                // ignore reporting errors
              }
            }
          )
        )
        .catch(() => {
          // ignore if Rollbar cannot be loaded (e.g., tests)
        });
    } else if (process.env.NODE_ENV !== 'production') {
      // Fallback: console.error in test/E2E or development mode
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [error, isRollbarDisabled]);

  return (
    <Container maxWidth='md' sx={{ py: 8 }}>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        textAlign='center'
        gap={3}
      >
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />

        <Typography variant='h4' component='h1' gutterBottom>
          Ein Fehler ist aufgetreten
        </Typography>

        <Typography variant='body1' color='text.secondary' maxWidth='sm'>
          Beim Laden der Seite ist ein Problem aufgetreten. Bitte versuche es
          erneut.
        </Typography>

        {process.env.NODE_ENV === 'development' && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              maxWidth: '100%',
              overflow: 'auto',
            }}
          >
            <Typography
              variant='caption'
              component='pre'
              sx={{ whiteSpace: 'pre-wrap' }}
            >
              {error.message}
            </Typography>
            {error.digest && (
              <Typography variant='caption' color='text.secondary'>
                Error ID: {error.digest}
              </Typography>
            )}
          </Box>
        )}

        <Box display='flex' gap={2} mt={2}>
          <Button variant='contained' startIcon={<Refresh />} onClick={reset}>
            Erneut versuchen
          </Button>

          <Button
            variant='outlined'
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Zur Startseite
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
