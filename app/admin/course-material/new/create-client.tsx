/**
 * Course Material Create Client Component
 * Feature: 026-course-material-integration, 030-extended-material-upload
 *
 * Client-side component for creating new course materials.
 * Shows MaterialTypeSelector first, then appropriate form based on selected mode.
 * Feature 030: Added CONTENT_UPLOAD mode for HTML file upload.
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
import HTMLContentUploadForm from '@/components/admin/HTMLContentUploadForm';
import { MaterialForm } from '@/components/admin/MaterialForm';
import MaterialTypeSelector from '@/components/admin/MaterialTypeSelector';
import SlideControlUploadForm from '@/components/admin/SlideControlUploadForm';
import type { MaterialCreationMode } from '@/lib/types/course-material';

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
  const [selectedMode, setSelectedMode] = useState<MaterialCreationMode | null>(
    null
  );

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

  const handleContentUploadSubmit = async (formData: FormData) => {
    const response = await fetch('/api/admin/course-material', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(
        response,
        'Upload fehlgeschlagen'
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
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            href='/admin'
            underline='hover'
            color='text.primary'
            sx={{ cursor: 'pointer' }}
          >
            Admin
          </Link>
          <Link
            href='/admin/course-material'
            underline='hover'
            color='text.primary'
            sx={{ cursor: 'pointer' }}
          >
            Seminarmaterial
          </Link>
          <Typography color='text.primary'>Neu</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => {
            router.push('/admin/course-material');
          }}
          aria-label='Zurück zur Seminarmaterial-Übersicht'
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h4' component='h1'>
          Neues Seminarmaterial erstellen
        </Typography>
      </Box>

      {!selectedMode && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant='h6' sx={{ mb: 2, textAlign: 'center' }}>
            Welche Art von Material möchtest du erstellen?
          </Typography>
          <MaterialTypeSelector onSelect={setSelectedMode} />
        </Paper>
      )}

      {selectedMode === 'CONTENT_EDITOR' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              size='small'
              onClick={() => {
                setSelectedMode(null);
              }}
              startIcon={<ArrowBackIcon />}
            >
              Zurück zur Auswahl
            </Button>
          </Box>
          <MaterialForm onSubmit={handleContentSubmit} />
        </Paper>
      )}

      {selectedMode === 'CONTENT_UPLOAD' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              size='small'
              onClick={() => {
                setSelectedMode(null);
              }}
              startIcon={<ArrowBackIcon />}
            >
              Zurück zur Auswahl
            </Button>
          </Box>
          <HTMLContentUploadForm
            onSubmit={handleContentUploadSubmit}
            onCancel={() => {
              router.push('/admin/course-material');
            }}
          />
        </Paper>
      )}

      {selectedMode === 'SLIDE_CONTROL' && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              size='small'
              onClick={() => {
                setSelectedMode(null);
              }}
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
