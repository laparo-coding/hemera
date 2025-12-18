/**
 * Delete Confirmation Modal
 *
 * Modal dialog for confirming course deletion
 * with enrollment count check and transfer option.
 */

'use client';

import WarningIcon from '@mui/icons-material/Warning';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface DeleteConfirmationProps {
  open: boolean;
  courseTitle: string;
  enrollmentCount: number;
  enrolledStudents?: Array<{
    userId: string;
    name: string | null;
    enrolledAt: Date;
  }>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  onTransfer?: () => void;
}

export default function DeleteConfirmation({
  open,
  courseTitle,
  enrollmentCount,
  enrolledStudents = [],
  onConfirm,
  onCancel,
  onTransfer,
}: DeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = enrollmentCount === 0;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color='error' />
        Kurs löschen
      </DialogTitle>

      <DialogContent>
        <Typography variant='body1' gutterBottom>
          Möchtest du wirklich "{courseTitle}" löschen?
        </Typography>

        {enrollmentCount > 0 ? (
          <>
            <Alert severity='error' sx={{ mt: 2, mb: 2 }}>
              <Typography variant='body2' fontWeight='medium'>
                Löschen nicht möglich: {enrollmentCount} Teilnehmer
                {enrollmentCount !== 1 ? '' : ''} angemeldet
              </Typography>
            </Alert>

            <Typography variant='body2' color='text.secondary' gutterBottom>
              Du musst alle angemeldeten Teilnehmer zu einem anderen Kurs
              übertragen, bevor du löschen kannst.
            </Typography>

            {enrolledStudents.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' gutterBottom>
                  Angemeldete Teilnehmer:
                </Typography>
                <List dense>
                  {enrolledStudents.slice(0, 5).map(student => (
                    <ListItem key={student.userId}>
                      <ListItemText
                        primary={student.name || 'Unbekannt'}
                        secondary={`Angemeldet: ${new Date(student.enrolledAt).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                  {enrolledStudents.length > 5 && (
                    <ListItem>
                      <ListItemText
                        secondary={`... und ${enrolledStudents.length - 5} weitere`}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </>
        ) : (
          <Alert severity='info' sx={{ mt: 2 }}>
            Dieser Kurs hat keine Anmeldungen und kann sicher gelöscht werden.
          </Alert>
        )}

        <Typography variant='body2' color='error' sx={{ mt: 2 }}>
          Diese Aktion kann nicht rückgängig gemacht werden.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={isDeleting}>
          Abbrechen
        </Button>

        {!canDelete && onTransfer && (
          <Button onClick={onTransfer} variant='outlined' disabled={isDeleting}>
            Teilnehmer übertragen
          </Button>
        )}

        <Button
          onClick={handleConfirm}
          color='error'
          variant='contained'
          disabled={!canDelete || isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} /> : null}
        >
          {isDeleting ? 'Wird gelöscht...' : 'Kurs löschen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
