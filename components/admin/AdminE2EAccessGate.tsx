'use client';

import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';

type MockRole = 'admin' | 'user';

function readMockRole(): MockRole {
  try {
    const raw = window.localStorage.getItem('clerk-session');
    if (!raw) {
      return 'user';
    }

    const parsed = JSON.parse(raw);
    return parsed?.user?.role === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}

export function AdminE2EAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [accessState, setAccessState] = useState<'checking' | 'admin' | 'user'>(
    'checking'
  );

  useLayoutEffect(() => {
    const syncRole = () => {
      const nextState = readMockRole();
      setAccessState(nextState);

      if (nextState !== 'admin') {
        router.replace('/dashboard');
      }
    };

    syncRole();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'clerk-session') {
        syncRole();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [router]);

  if (accessState !== 'admin') {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return <>{children}</>;
}
