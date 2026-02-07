/**
 * Role Assignment Dialog
 * Feature: 024-admin-dashboard
 *
 * Dialog for assigning admin/user role to a user.
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
              checked={isAdmin}
              onChange={e => onConfirm(e.target.checked)}
              disabled={loading}
              data-testid='admin-role-toggle'
            />
          }
          label={isAdmin ? 'Admin' : 'Benutzer'}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Schließen
        </Button>
        {loading && <CircularProgress size={20} />}
      </DialogActions>
    </Dialog>
  );
}
