'use client';

/**
 * Seminarmaterial Detail Page
 * Feature: 023-slide-editor
 *
 * Displays a single seminar material with its metadata and content preview.
 */

import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/admin/DeleteConfirmationDialog';

interface MaterialDetail {
  id: string;
  identifier: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });
}

export default function SeminarmaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/course-material/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Material nicht gefunden');
        }
        throw new Error('Fehler beim Laden des Materials');
      }
      const data = await response.json();
      setMaterial(data);
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

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/course-material/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen');
      }
      router.push('/admin/course-material');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Löschen fehlgeschlagen'
      );
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/course-material')}
        >
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }

  if (!material) {
    return null;
  }

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
          <Typography color='text.primary'>{material.title}</Typography>
        </Breadcrumbs>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/course-material')}
            variant='text'
          >
            Zurück
          </Button>
          <Typography variant='h4' component='h1'>
            {material.title}
          </Typography>
        </Box>

        <Stack direction='row' spacing={1}>
          <Button
            startIcon={<EditIcon />}
            variant='contained'
            onClick={() =>
              router.push(`/admin/course-material/${id}/edit`)
            }
          >
            Bearbeiten
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            variant='outlined'
            color='error'
            onClick={() => setDeleteDialogOpen(true)}
          >
            Löschen
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Kennung
              </Typography>
              <Typography variant='body1'>{material.identifier}</Typography>
            </Box>
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Erstellt am
              </Typography>
              <Typography variant='body1'>
                {formatDate(material.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='subtitle2' color='text.secondary'>
                Zuletzt aktualisiert
              </Typography>
              <Typography variant='body1'>
                {formatDate(material.updatedAt)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title='Seminarmaterial löschen'
        message={`Möchtest du "${material.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </Container>
  );
}
