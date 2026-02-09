'use client';

/**
 * Course Material Edit Page
 * Feature: 023-slide-editor
 *
 * Edit an existing course material (title, identifier, HTML content).
 */

import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MaterialForm } from '@/components/admin/MaterialForm';

interface MaterialDetail {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditCourseMaterialPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterial = useCallback(async () => {
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

  const handleSubmit = async (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => {
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
        throw new Error(errorMessage);
      }

      router.push(`/admin/course-material/${id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Aktualisieren fehlgeschlagen';
      throw new Error(message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !material) {
    return (
      <Alert severity='error'>{error || 'Material nicht gefunden'}</Alert>
    );
  }

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom>
        Seminarmaterial bearbeiten
      </Typography>

      <Paper elevation={2} sx={{ p: 3 }}>
        <MaterialForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/course-material/${id}`)}
          initialData={{
            title: material.title,
            identifier: material.identifier,
            htmlContent,
          }}
        />
      </Paper>
    </Box>
  );
}
