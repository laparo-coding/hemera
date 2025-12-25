'use client';

/**
 * Client Component for editing a location
 * Feature: 015-course-locations
 *
 * Receives pre-fetched location data from the Server Component parent.
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
import type { LocationUpdateInput } from '@/lib/schemas/location-schema';

interface LocationData {
  id: string;
  name: string;
  description?: string;
  address: string;
  zipCode?: string;
  city: string;
  email?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  roomImageUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface EditLocationClientProps {
  initialLocation: LocationData;
}

export default function EditLocationClient({
  initialLocation,
}: EditLocationClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LocationUpdateInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/locations/${initialLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = 'Fehler beim Aktualisieren der Location';
        if (typeof errorData.error === 'string') {
          errorMsg = errorData.error;
        } else if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        }
        throw new Error(errorMsg);
      }

      router.push('/admin/locations');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Ein unbekannter Fehler ist aufgetreten'
      );
    } finally {
      setSubmitting(false);
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
        <Typography color='text.primary'>Bearbeiten</Typography>
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
          Location bearbeiten
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          {initialLocation.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <LocationForm
          key={initialLocation.id}
          initialData={initialLocation}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />
      </Paper>
    </Container>
  );
}
