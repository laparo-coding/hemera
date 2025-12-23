'use client';

/**
 * LocationForm Component - Create/Edit location form
 * Feature: 015-course-locations
 * Task: T034
 */

import { MyLocation as GeoIcon, Save as SaveIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type {
  LocationInput,
  LocationResponse,
} from '@/lib/schemas/location-schema';

interface LocationFormProps {
  initialData?: Partial<LocationResponse>;
  onSubmit: (data: LocationInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function LocationForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: LocationFormProps) {
  const [formData, setFormData] = useState<LocationInput>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    address: initialData?.address ?? '',
    zipCode: initialData?.zipCode ?? '',
    city: initialData?.city ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    website: initialData?.website ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    roomImageUrl: initialData?.roomImageUrl ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [geocodeStatus, setGeocodeStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [coordinates, setCoordinates] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: initialData?.latitude ?? null,
    lng: initialData?.longitude ?? null,
  });

  const handleChange =
    (field: keyof LocationInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      // Clear error when user types
      if (errors[field]) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const handleGeocode = async () => {
    if (!formData.address || !formData.city) {
      setErrors(prev => ({
        ...prev,
        address: !formData.address ? 'Adresse ist erforderlich' : '',
        city: !formData.city ? 'Stadt ist erforderlich' : '',
      }));
      return;
    }

    setGeocodeStatus('loading');
    try {
      const response = await fetch('/api/locations/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.data?.success) {
        setCoordinates({ lat: data.data.latitude, lng: data.data.longitude });
        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('error');
      }
    } catch {
      setGeocodeStatus('error');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Adresse ist erforderlich';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website muss mit http:// oder https:// beginnen';
    }
    if (formData.imageUrl && !/^https?:\/\/.+/.test(formData.imageUrl)) {
      newErrors.imageUrl = 'Bild-URL muss mit http:// oder https:// beginnen';
    }
    if (
      formData.roomImageUrl &&
      !/^https?:\/\/.+/.test(formData.roomImageUrl)
    ) {
      newErrors.roomImageUrl =
        'Raumbild-URL muss mit http:// oder https:// beginnen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const isEditing = !!initialData?.id;

  return (
    <Box component='form' onSubmit={handleSubmit} noValidate>
      <Grid container spacing={3}>
        {/* Basic Info Section */}
        <Grid size={12}>
          <Typography variant='h6' gutterBottom>
            Grundinformationen
          </Typography>
        </Grid>

        <Grid size={12}>
          <TextField
            required
            fullWidth
            label='Name'
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            disabled={isLoading}
            inputProps={{ maxLength: 200 }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Beschreibung'
            value={formData.description ?? ''}
            onChange={handleChange('description')}
            disabled={isLoading}
            inputProps={{ maxLength: 2000 }}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant='h6' gutterBottom sx={{ mt: 2 }}>
            Adresse
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            required
            fullWidth
            label='Adresse'
            value={formData.address}
            onChange={handleChange('address')}
            error={!!errors.address}
            helperText={errors.address}
            disabled={isLoading}
            inputProps={{ maxLength: 500 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label='PLZ'
            value={formData.zipCode ?? ''}
            onChange={handleChange('zipCode')}
            disabled={isLoading}
            inputProps={{ maxLength: 20 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            required
            fullWidth
            label='Stadt'
            value={formData.city}
            onChange={handleChange('city')}
            error={!!errors.city}
            helperText={errors.city}
            disabled={isLoading}
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            fullWidth
            variant='outlined'
            startIcon={
              geocodeStatus === 'loading' ? (
                <CircularProgress size={20} />
              ) : (
                <GeoIcon />
              )
            }
            onClick={handleGeocode}
            disabled={isLoading || geocodeStatus === 'loading'}
            sx={{ height: '56px' }}
          >
            Koordinaten abrufen
          </Button>
        </Grid>

        {geocodeStatus === 'success' && coordinates.lat && coordinates.lng && (
          <Grid size={12}>
            <Alert severity='success'>
              Koordinaten gefunden: {coordinates.lat.toFixed(6)},{' '}
              {coordinates.lng.toFixed(6)}
            </Alert>
          </Grid>
        )}

        {geocodeStatus === 'error' && (
          <Grid size={12}>
            <Alert severity='warning'>
              Adresse konnte nicht gefunden werden. Die Location wird ohne
              Kartenansicht gespeichert.
            </Alert>
          </Grid>
        )}

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant='h6' gutterBottom sx={{ mt: 2 }}>
            Kontakt
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='E-Mail'
            type='email'
            value={formData.email ?? ''}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='Telefon'
            value={formData.phone ?? ''}
            onChange={handleChange('phone')}
            disabled={isLoading}
            inputProps={{ maxLength: 50 }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label='Website'
            type='url'
            value={formData.website ?? ''}
            onChange={handleChange('website')}
            error={!!errors.website}
            helperText={errors.website || 'z.B. https://example.com'}
            disabled={isLoading}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant='h6' gutterBottom sx={{ mt: 2 }}>
            Bilder
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='Bild-URL (Außenansicht)'
            type='url'
            value={formData.imageUrl ?? ''}
            onChange={handleChange('imageUrl')}
            error={!!errors.imageUrl}
            helperText={errors.imageUrl}
            disabled={isLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='Raumbild-URL (Innenansicht)'
            type='url'
            value={formData.roomImageUrl ?? ''}
            onChange={handleChange('roomImageUrl')}
            error={!!errors.roomImageUrl}
            helperText={errors.roomImageUrl}
            disabled={isLoading}
          />
        </Grid>

        {/* Actions */}
        <Grid size={12}>
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
          >
            {onCancel && (
              <Button
                variant='outlined'
                onClick={onCancel}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
            )}
            <Button
              type='submit'
              variant='contained'
              startIcon={
                isLoading ? <CircularProgress size={20} /> : <SaveIcon />
              }
              disabled={isLoading}
            >
              {isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
