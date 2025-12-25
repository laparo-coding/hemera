'use client';

/**
 * Admin Locations Table Client Wrapper
 * Handles edit/delete actions with navigation and confirmation dialog
 * Feature: 015-course-locations
 * Task: T041
 */

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LocationsTable from '@/components/admin/LocationsTable';
import type { LocationResponse } from '@/lib/schemas/location-schema';

interface LocationsTableClientProps {
  locations: LocationResponse[];
}

export default function LocationsTableClient({
  locations,
}: LocationsTableClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] =
    useState<LocationResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleEdit = (id: string) => {
    router.push(`/admin/locations/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    const location = locations.find(l => l.id === id);
    if (location) {
      setLocationToDelete(location);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/locations/${locationToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      setSnackbar({
        open: true,
        message: `"${locationToDelete.name}" wurde gelöscht`,
        severity: 'success',
      });
      router.refresh();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Fehler beim Löschen',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <LocationsTable
        locations={locations}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby='delete-dialog-title'
        aria-describedby='delete-dialog-description'
      >
        <DialogTitle id='delete-dialog-title'>Location löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText id='delete-dialog-description'>
            Möchtest du die Location &quot;{locationToDelete?.name}&quot;
            wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            disabled={deleting}
          >
            {deleting ? 'Lösche...' : 'Löschen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
