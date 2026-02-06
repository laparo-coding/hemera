'use client';

/**
 * PendingBookingsTable Component - Admin table for PRE_BOOKED bookings
 * Feature: 021-learning-path
 * Task: T020
 *
 * Displays bookings awaiting admin review (PRE_BOOKED status).
 * Allows admins to approve or reject bookings.
 * Includes pagination for better UX with many bookings.
 */

import {
  Check as ApproveIcon,
  Refresh as RefreshIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { PendingBooking } from '@/lib/schemas/admin/booking';
import BookingReviewDialog from './BookingReviewDialog';

interface PendingBookingsTableProps {
  onRefresh?: () => void;
}

/**
 * Format date for display (German locale)
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get level chip color
 */
function getLevelColor(
  level: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success' {
  switch (level) {
    case 'BEGINNER':
      return 'success';
    case 'INTERMEDIATE':
      return 'warning';
    case 'ADVANCED':
      return 'error';
    default:
      return 'default';
  }
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

export default function PendingBookingsTable({
  onRefresh,
}: PendingBookingsTableProps) {
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(
    null
  );
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>(
    'approve'
  );

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchPendingBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bookings/pending');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der ausstehenden Buchungen');
      }
      const data = await response.json();
      setBookings(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingBookings();
  }, [fetchPendingBookings]);

  const handleOpenReviewDialog = (
    booking: PendingBooking,
    action: 'approve' | 'reject'
  ) => {
    setSelectedBooking(booking);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleReviewComplete = () => {
    handleCloseReviewDialog();
    fetchPendingBookings();
    onRefresh?.();
  };

  const handleRefresh = () => {
    fetchPendingBookings();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
        <Button onClick={handleRefresh} size='small' sx={{ ml: 2 }}>
          Erneut versuchen
        </Button>
      </Alert>
    );
  }

  if (bookings.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color='text.secondary'>
          Keine ausstehenden Buchungen zur Überprüfung
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Aktualisieren
        </Button>
      </Paper>
    );
  }

  return (
    <>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6'>
          Ausstehende Buchungen ({bookings.length})
        </Typography>
        <Tooltip title='Aktualisieren'>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Teilnehmer</TableCell>
              <TableCell>E-Mail</TableCell>
              <TableCell>Kurs</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Outperformer</TableCell>
              <TableCell align='right'>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(booking => (
                <TableRow key={booking.id} hover>
                  <TableCell>
                    <Typography variant='body2'>
                      {formatDate(booking.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {booking.user.firstName} {booking.user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color='text.secondary'>
                      {booking.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>{booking.course.title}</Typography>
                    {booking.course.startDate && (
                      <Typography variant='caption' color='text.secondary'>
                        Start: {formatDate(booking.course.startDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getLevelLabel(booking.course.level)}
                      color={getLevelColor(booking.course.level)}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    {booking.user.isOutperformer ? (
                      <Chip
                        label='Ja'
                        color='success'
                        size='small'
                        variant='outlined'
                      />
                    ) : (
                      <Chip
                        label='Nein'
                        color='default'
                        size='small'
                        variant='outlined'
                      />
                    )}
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Genehmigen'>
                      <IconButton
                        color='success'
                        onClick={() =>
                          handleOpenReviewDialog(booking, 'approve')
                        }
                      >
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Ablehnen'>
                      <IconButton
                        color='error'
                        onClick={() =>
                          handleOpenReviewDialog(booking, 'reject')
                        }
                      >
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component='div'
        count={bookings.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage='Pro Seite:'
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} von ${count}`
        }
      />

      {selectedBooking && (
        <BookingReviewDialog
          open={reviewDialogOpen}
          booking={selectedBooking}
          action={reviewAction}
          onClose={handleCloseReviewDialog}
          onComplete={handleReviewComplete}
        />
      )}
    </>
  );
}
