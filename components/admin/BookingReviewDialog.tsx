'use client';

/**
 * BookingReviewDialog Component - Dialog for approving/rejecting bookings
 * Feature: 021-learning-path
 * Task: T021
 *
 * Confirmation dialog for reviewing PRE_BOOKED bookings.
 *
 * USAGE:
 * - Import this component in admin booking list/detail pages
 * - Pass PRE_BOOKED booking and action (approve/reject)
 * - Calls PATCH /api/admin/bookings/{id}/review
 * - Shows success/error feedback
 *
 * TODO: Integrate with admin dashboard pending bookings list
 * TODO: Add admin notes field for approval/rejection reason
 * TODO: Show prerequisite completion history
 * TODO: Add estimated review time display
 *
 * @see docs/features/021-learning-path/PRE_BOOKED_APPROVAL_WORKFLOW.md
 */

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { PendingBooking } from '@/lib/schemas/admin/booking';

interface BookingReviewDialogProps {
  open: boolean;
  booking: PendingBooking;
  action: 'approve' | 'reject';
  onClose: () => void;
  onComplete: () => void;
}

export default function BookingReviewDialog({
  open,
  booking,
  action,
  onClose,
  onComplete,
}: BookingReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler bei der Verarbeitung');
      }

      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  };

  const isApprove = action === 'approve';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle>
        {isApprove ? 'Buchung genehmigen' : 'Buchung ablehnen'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContentText component='div'>
          <Box mb={2}>
            {isApprove ? (
              <Typography>
                Möchtest du die folgende Buchung genehmigen? Der Teilnehmer kann
                dann die Zahlung abschließen.
              </Typography>
            ) : (
              <Typography>
                Möchtest du die folgende Buchung ablehnen? Der Teilnehmer wird
                per E-Mail benachrichtigt und die Buchung wird gelöscht.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: 'background.default',
              p: 2,
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Typography variant='subtitle2' color='text.secondary'>
              Teilnehmer
            </Typography>
            <Typography>
              {booking.user.firstName} {booking.user.lastName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {booking.user.email}
            </Typography>

            <Box mt={2}>
              <Typography variant='subtitle2' color='text.secondary'>
                Kurs
              </Typography>
              <Typography>{booking.course.title}</Typography>
              <Typography variant='body2' color='text.secondary'>
                Niveau: {getLevelLabel(booking.course.level)}
              </Typography>
            </Box>

            {booking.user.isOutperformer && (
              <Box mt={2}>
                <Alert severity='info' variant='outlined'>
                  Dieser Teilnehmer ist als Outperformer markiert.
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          color={isApprove ? 'success' : 'error'}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading
            ? 'Wird verarbeitet...'
            : isApprove
              ? 'Genehmigen'
              : 'Ablehnen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Get level label in German
 */
function getLevelLabel(level: string): string {
  switch (level) {
    case 'BEGINNER':
      return 'Basis';
    case 'INTERMEDIATE':
      return 'Fortgeschritten';
    case 'ADVANCED':
      return 'Masterclass';
    default:
      return level;
  }
}
