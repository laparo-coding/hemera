'use client';

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Container,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { MaterialForm } from '@/components/admin/MaterialForm';

export default function NeuSeminarmaterialPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    const response = await fetch('/api/admin/course-material', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Erstellen fehlgeschlagen';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        // Non-JSON response, use default message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    router.push(`/admin/course-material/${result.id}`);
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            href='/admin'
            underline='hover'
            color='inherit'
            sx={{ cursor: 'pointer' }}
          >
            Admin
          </Link>
          <Link
            href='/admin/course-material'
            underline='hover'
            color='inherit'
            sx={{ cursor: 'pointer' }}
          >
            Seminarmaterial
          </Link>
          <Typography color='text.primary'>Neu</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => router.push('/admin/course-material')}
          aria-label='Zurück zur Seminarmaterial-Übersicht'
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h4' component='h1'>
          Neues Seminarmaterial erstellen
        </Typography>
      </Box>

      <MaterialForm onSubmit={handleSubmit} />
    </Container>
  );
}
