/**
 * Generic Delete Confirmation Dialog
 * Feature: 024-admin-dashboard
 *
 * Reusable dialog for confirming delete actions across admin tables.
 */

'use client';

import WarningIcon from '@mui/icons-material/Warning';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Loading state during deletion */
  loading?: boolean;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
}

export function DeleteConfirmationDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  confirmText = 'Löschen',
  cancelText = 'Abbrechen',
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      disableEscapeKeyDown={loading}
      maxWidth='sm'
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color='error' />
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant='body1'>{message}</Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color='error'
          variant='contained'
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
