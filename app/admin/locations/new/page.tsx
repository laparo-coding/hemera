'use client';

/**
 * Admin Create New Location Page
 * Feature: 015-course-locations
 * Task: T037
 */

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LocationForm from '@/components/LocationForm';
import type { LocationCreateInput } from '@/lib/schemas/location-schema';

export default function NewLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LocationCreateInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Fehler beim Erstellen der Location'
        );
      }

      router.push('/admin/locations');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ein unbekannter Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/locations');
  };

  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href='/admin'
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          Admin
        </Link>
        <Link
          href='/admin/locations'
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          Locations
        </Link>
        <Typography color='text.primary'>Neu</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href='/admin/locations'
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Zurück zur Übersicht
        </Button>
        <Typography variant='h4' component='h1' gutterBottom>
          Neue Location erstellen
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Füge einen neuen Kursstandort hinzu
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <LocationForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
        />
      </Paper>
    </Container>
  );
}
