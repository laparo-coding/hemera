/**
 * Course Material Create Client Component
 * Feature: 026-course-material-integration
 *
 * Client-side component for creating new course materials.
 * Shows MaterialTypeSelector first, then appropriate form based on type.
 */

'use client';

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  IconButton,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';
import MaterialTypeSelector from '@/components/admin/MaterialTypeSelector';
import SlideControlUploadForm from '@/components/admin/SlideControlUploadForm';
import type { MaterialType } from '@/lib/schemas/admin/course-material';

/** Extract error message from a fetch Response, falling back to a default */
async function extractErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const error = await response.json();
    return error.message || fallback;
  } catch {
    return fallback;
  }
}

export default function CreateCourseMaterialClient() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<MaterialType | null>(null);

  const handleContentSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    const response = await fetch('/api/admin/course-material', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: 'CONTENT' }),
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(
        response,
        'Erstellen fehlgeschlagen'
      );
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result || typeof result.id !== 'string') {
      throw new Error('Ungültige Serverantwort');
    }
    router.push('/admin/course-material');
  };

  const handleSlideControlSubmit = async (formData: FormData) => {
    try {
      formData.append('type', 'SLIDE_CONTROL');
      const response = await fetch('/api/admin/course-material', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(
          response,
          'Erstellen fehlgeschlagen'
        );
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

      {!selectedType && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant='h6' sx={{ mb: 2, textAlign: 'center' }}>
            Welche Art von Material möchtest du erstellen?
          </Typography>
          <MaterialTypeSelector onSelect={setSelectedType} />
        </Paper>
      )}

      {selectedType === 'CONTENT' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              size='small'
              onClick={() => setSelectedType(null)}
              startIcon={<ArrowBackIcon />}
            >
              Zurück zur Auswahl
            </Button>
          </Box>
          <MaterialForm onSubmit={handleContentSubmit} />
        </Paper>
      )}

      {selectedType === 'SLIDE_CONTROL' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              size='small'
              onClick={() => setSelectedType(null)}
              startIcon={<ArrowBackIcon />}
            >
              Zurück zur Auswahl
            </Button>
          </Box>
          <SlideControlUploadForm
            onSubmit={handleSlideControlSubmit}
            onCancel={() => router.push('/admin/course-material')}
          />
        </Paper>
      )}
    </Container>
  );
}
