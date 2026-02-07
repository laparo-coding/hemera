/**
 * Role Assignment Dialog
 * Feature: 024-admin-dashboard
 *
 * Dialog for assigning admin/user role to a user.
 * Uses local state with explicit confirmation button to prevent accidental changes.
 */

'use client';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface RoleAssignmentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** User name to display */
  userName: string | null;
  /** Current admin status */
  isAdmin: boolean;
  /** Called with the new admin status */
  onConfirm: (isAdmin: boolean) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Loading state */
  loading?: boolean;
}

export function RoleAssignmentDialog({
  open,
  userName,
  isAdmin,
  onConfirm,
  onCancel,
  loading = false,
}: RoleAssignmentDialogProps) {
  const [localIsAdmin, setLocalIsAdmin] = useState(isAdmin);

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) setLocalIsAdmin(isAdmin);
  }, [open, isAdmin]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      disableEscapeKeyDown={loading}
      maxWidth='sm'
      fullWidth
      data-testid='role-assignment-dialog'
    >
      <DialogTitle>Rolle zuweisen</DialogTitle>

      <DialogContent>
        <Typography variant='body1' sx={{ mb: 2 }}>
          Rolle für {userName || 'Benutzer'} ändern:
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={localIsAdmin}
              onChange={e => setLocalIsAdmin(e.target.checked)}
              disabled={loading}
              data-testid='admin-role-toggle'
            />
          }
          label={localIsAdmin ? 'Admin' : 'Benutzer'}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={() => onConfirm(localIsAdmin)}
          disabled={loading || localIsAdmin === isAdmin}
          variant='contained'
          data-testid='role-confirm-button'
        >
          Speichern
        </Button>
        {loading && <CircularProgress size={20} />}
      </DialogActions>
    </Dialog>
  );
}
