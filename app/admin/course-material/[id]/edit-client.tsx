'use client';

/**
 * Edit Course Material Client Component
 * Feature: 023-slide-editor
 *
 * Client-side component for editing course materials
 */

import { Alert, Box, CircularProgress, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';

interface MaterialDetail {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface EditCourseMaterialClientProps {
  id: string;
}

export default function EditCourseMaterialClient({
  id,
}: EditCourseMaterialClientProps) {
  const router = useRouter();
  const [state, setState] = useState<{
    material: MaterialDetail | null;
    htmlContent: string;
    loading: boolean;
    error: string | null;
  }>({
    material: null,
    htmlContent: '',
    loading: true,
    error: null,
  });

  const fetchMaterial = useCallback(async () => {
    if (!id) {
      setState(s => ({
        ...s,
        error: 'Material-ID nicht gefunden',
        loading: false,
      }));
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));
    try {
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
      let htmlContent = '';
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        htmlContent = contentData.htmlContent || '';
      } else {
        throw new Error('Inhalt konnte nicht geladen werden');
      }

      setState(s => ({
        ...s,
        material: metaData,
        htmlContent,
        loading: false,
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        error:
          err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten',
        loading: false,
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
    setState(s => ({ ...s, error: null }));
    try {
      const response = await fetch(`/api/admin/course-material/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Aktualisieren fehlgeschlagen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Non-JSON response
        }
        setState(s => ({ ...s, error: errorMessage }));
        return;
      }

      router.push('/admin/course-material');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Aktualisieren fehlgeschlagen';
      setState(s => ({ ...s, error: message }));
    }
  };

  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.error) {
    return <Alert severity='error'>{state.error}</Alert>;
  }

  if (!state.material) {
    return <Alert severity='error'>Material nicht gefunden</Alert>;
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <MaterialForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/course-material')}
        initialData={{
          title: state.material.title,
          identifier: state.material.identifier,
          htmlContent: state.htmlContent,
        }}
      />
    </Paper>
  );
}
