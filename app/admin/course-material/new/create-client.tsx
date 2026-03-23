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
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Container,
  IconButton,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { useRollbar } from '@rollbar/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';
import MaterialTypeSelector from '@/components/admin/MaterialTypeSelector';
import SlideControlUploadForm from '@/components/admin/SlideControlUploadForm';
import type { MaterialType } from '@/lib/schemas/admin/course-material';

/** Expected errors from server validation / non-ok responses */
class ExpectedMaterialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpectedMaterialError';
  }
}

/**
 * Handles error extraction for material creation failures
 * Extracts error message from caught exception
 */
function handleCreateError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return 'Fehler beim Erstellen des Materials';
}

export default function CreateCourseMaterialClient() {
  const router = useRouter();
  const rollbar = useRollbar();
  const [selectedType, setSelectedType] = useState<MaterialType | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Manage focus for screen readers when form type changes
  useEffect(() => {
    if (selectedType && headingRef.current) {
      headingRef.current.focus();
    }
  }, [selectedType]);

  function reportMaterialCreationError(err: unknown) {
    if (err instanceof ExpectedMaterialError) return;
    if (err instanceof Error) {
      rollbar.error('Unexpected material creation error', err, {
        type: selectedType,
      });
    } else {
      rollbar.error('Unexpected material creation error', {
        raw: String(err),
        type: selectedType,
      });
    }
  }

  /**
   * Shared helper for submitting course material (JSON or FormData)
   * Performs fetch, error parsing, response validation, and returns the result
   */
  const submitCourseMaterial = async (
    body: BodyInit,
    headers?: Record<string, string>
  ): Promise<{ id: string }> => {
    const response = await fetch('/api/admin/course-material', {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      let errorMessage = 'Erstellen fehlgeschlagen';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Non-JSON response
      }
      throw new ExpectedMaterialError(errorMessage);
    }

    let result: { id: string };
    try {
      result = await response.json();
      if (!result || typeof result.id !== 'string') {
        throw new ExpectedMaterialError('Ungültige Serverantwort');
      }
    } catch (err) {
      if (err instanceof ExpectedMaterialError) {
        throw err;
      }
      throw new ExpectedMaterialError('Ungültige Serverantwort');
    }

    return result;
  };

  const handleContentSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setCreateError(null);
      await submitCourseMaterial(JSON.stringify(data), {
        'Content-Type': 'application/json',
      });
      router.push('/admin/course-material');
    } catch (err) {
      reportMaterialCreationError(err);
      setCreateError(handleCreateError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlideControlSubmit = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setCreateError(null);
      await submitCourseMaterial(formData);
      router.push('/admin/course-material');
    } catch (err) {
      reportMaterialCreationError(err);
      setCreateError(handleCreateError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            component={NextLink}
            href='/admin'
            underline='hover'
            color='inherit'
          >
            Admin
          </Link>
          <Link
            component={NextLink}
            href='/admin/course-material'
            underline='hover'
            color='inherit'
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

      {createError && (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
          onClose={() => setCreateError(null)}
        >
          {createError}
        </Alert>
      )}

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
          <Typography
            ref={headingRef}
            component='h2'
            variant='h6'
            tabIndex={-1}
            sx={{ mb: 2 }}
          >
            Inhaltsseite erstellen
          </Typography>
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
          <Typography
            ref={headingRef}
            component='h2'
            variant='h6'
            tabIndex={-1}
            sx={{ mb: 2 }}
          >
            Steuerdatei hochladen
          </Typography>
          <SlideControlUploadForm
            onSubmit={handleSlideControlSubmit}
            onCancel={() => router.push('/admin/course-material')}
          />
        </Paper>
      )}
    </Container>
  );
}
