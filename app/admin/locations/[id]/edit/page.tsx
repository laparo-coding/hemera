'use client';

/**
 * Admin Edit Location Page
 * Feature: 015-course-locations
 * Task: T038
 */

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LocationForm from '@/components/LocationForm';
import type {
  LocationResponse,
  LocationUpdateInput,
} from '@/lib/schemas/location-schema';

interface EditLocationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
  const router = useRouter();
  const [location, setLocation] = useState<LocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setLocationId(p.id));
  }, [params]);

  useEffect(() => {
    if (!locationId) return;

    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/locations/${locationId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Location nicht gefunden');
          }
          throw new Error('Fehler beim Laden der Location');
        }
        const data = await response.json();
        setLocation(data);
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

    fetchLocation();
  }, [locationId]);

  const handleSubmit = async (data: LocationUpdateInput) => {
    if (!locationId) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Fehler beim Aktualisieren der Location'
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
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/locations');
  };

  if (loading) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!location && !loading) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Alert severity='error'>{error || 'Location nicht gefunden'}</Alert>
        <Button
          component={Link}
          href='/admin/locations'
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }

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
          {location?.name}
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {location && (
          <LocationForm
            initialData={{
              name: location.name,
              description: location.description ?? undefined,
              address: location.address,
              zipCode: location.zipCode ?? undefined,
              city: location.city,
              email: location.email ?? undefined,
              phone: location.phone ?? undefined,
              website: location.website ?? undefined,
              imageUrl: location.imageUrl ?? undefined,
              roomImageUrl: location.roomImageUrl ?? undefined,
              latitude: location.latitude ?? undefined,
              longitude: location.longitude ?? undefined,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitting}
          />
        )}
      </Paper>
    </Container>
  );
}
