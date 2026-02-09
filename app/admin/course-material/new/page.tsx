'use client';

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Container,
  IconButton,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { MaterialForm } from '@/components/admin/MaterialForm';

export default function NewCourseMaterialPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    try {
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
      if (!result || typeof result.id !== 'string') {
        throw new Error('Ungültige Serverantwort');
      }
      router.push('/admin/course-material');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erstellen fehlgeschlagen';
      throw new Error(message);
    }
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

      <Paper elevation={2} sx={{ p: 3 }}>
        <MaterialForm onSubmit={handleSubmit} />
      </Paper>
    </Container>
  );
}
