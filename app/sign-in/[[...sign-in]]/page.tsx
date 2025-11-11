'use client';

import { SignIn } from '@clerk/nextjs';
import { Box, Container } from '@mui/material';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url') || '/dashboard';

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <SignIn
            redirectUrl={redirectUrl}
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                },
                card: {
                  width: '100%',
                },
              },
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}
