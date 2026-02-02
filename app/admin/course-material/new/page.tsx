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
import { useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';

export default function NeuSeminarmaterialPage() {
  const router = useRouter();
  const [_isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/course-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erstellen fehlgeschlagen');
      }

      const result = await response.json();
      router.push(`/admin/course-material/${result.id}`);
    } finally {
      setIsSubmitting(false);
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
        <IconButton onClick={() => router.push('/admin/course-material')}>
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
