'use client';

/**
 * Edit Course Material Client Component
 * Feature: 023-slide-editor, 026-course-material-integration
 *
 * Client-side component for editing course materials.
 * Renders MaterialForm for CONTENT or SlideControlUploadForm for SLIDE_CONTROL.
 */

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useRollbar } from '@rollbar/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';
import SlideControlUploadForm from '@/components/admin/SlideControlUploadForm';

interface MaterialDetail {
  id: string;
  identifier: string;
  title: string;
  type: string;
  blobUrl?: string | null;
  blobPathname?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditCourseMaterialClientProps {
  id: string;
}

/**
 * Extract error message from HTTP error response
 * Attempts to parse response as JSON and extract the message field,
 * falls back to default message if response is not valid JSON
 */
async function extractErrorMessage(
  response: Response,
  defaultMessage: string
): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.message || defaultMessage;
  } catch {
    // Response is not valid JSON, return default
    return defaultMessage;
  }
}

export default function EditCourseMaterialClient({
  id,
}: EditCourseMaterialClientProps) {
  const router = useRouter();
  const rollbar = useRollbar();

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = useCallback(
    () => router.push('/admin/course-material'),
    [router]
  );

  const fetchMaterial = useCallback(async () => {
    if (!id) {
      setError('Material-ID nicht gefunden');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch metadata and content in parallel
      const [metaRes, contentRes] = await Promise.all([
        fetch(`/api/admin/course-material/${id}`),
        fetch(`/api/admin/course-material/${id}/content`),
      ]);

      if (!metaRes.ok) {
        if (metaRes.status === 404) {
          throw new Error('Material nicht gefunden');
        }
        throw new Error('Fehler beim Laden des Materials');
      }

      const metaData = await metaRes.json();
      setMaterial(metaData);

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setHtmlContent(contentData.htmlContent || '');
      } else {
        // Only treat content fetch failure as blocking error for CONTENT type
        if (metaData.type === 'CONTENT') {
          const contentErrorMsg = await extractErrorMessage(
            contentRes,
            'Inhalt konnte nicht geladen werden'
          );
          setError(contentErrorMsg);
        } else {
          // For SLIDE_CONTROL, swallow the error - content is stored in Vercel Blob
          setHtmlContent('');
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  /**
   * Performs a fetch with network error handling.
   * Wraps fetch to provide user-friendly error on network failure
   * and extracts error messages from non-OK responses.
   */
  const fetchWithErrorHandling = async (
    url: string,
    options: RequestInit
  ): Promise<Response> => {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      try {
        rollbar.error('Network failure in material editor', {
          url,
          method: options.method,
          error: err instanceof Error ? err.message : 'unknown network error',
        });
      } catch (_rbErr) {
        // Swallow rollbar errors to ensure user-facing error is thrown
      }
      throw new Error('Netzwerkfehler – bitte versuche es erneut');
    }

    if (!response.ok) {
      rollbar.error('Non-OK HTTP response in material editor', {
        url,
        method: options.method,
        status: response.status,
        statusText: response.statusText,
      });
      const errorMessage = await extractErrorMessage(
        response,
        'Aktualisieren fehlgeschlagen'
      );
      throw new Error(errorMessage);
    }

    return response;
  };

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchWithErrorHandling(`/api/admin/course-material/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      router.push('/admin/course-material');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSlideControlSubmit = async (formData: FormData) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await fetchWithErrorHandling(`/api/admin/course-material/${id}`, {
        method: 'PUT',
        body: formData,
      });

      router.push('/admin/course-material');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
        role='status'
        aria-live='polite'
      >
        <CircularProgress aria-label='Inhalt wird geladen' />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  if (!material) {
    return <Alert severity='error'>Material nicht gefunden</Alert>;
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          Typ:
        </Typography>
        <Chip
          label={
            material.type === 'SLIDE_CONTROL' ? 'Steuerdatei' : 'Inhaltsseite'
          }
          size='small'
          color={material.type === 'SLIDE_CONTROL' ? 'secondary' : 'default'}
        />
      </Box>

      {material.type === 'SLIDE_CONTROL' ? (
        <SlideControlUploadForm
          onSubmit={handleSlideControlSubmit}
          onCancel={handleCancel}
          initialData={{
            title: material.title,
            identifier: material.identifier,
            blobPathname: material.blobPathname,
            blobUrl: material.blobUrl,
          }}
        />
      ) : (
        <MaterialForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={{
            title: material.title,
            identifier: material.identifier,
            htmlContent,
          }}
        />
      )}
    </Paper>
  );
}
