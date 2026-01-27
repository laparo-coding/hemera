'use client';

/**
 * UserOutperformerToggle Component - Toggle for user outperformer status
 * Feature: 021-learning-path
 * Task: T022
 *
 * Allows admins to mark users as "outperformers" who can skip prerequisites.
 */

import {
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

interface UserOutperformerToggleProps {
  userId: string;
  initialValue: boolean;
  onUpdate?: (newValue: boolean) => void;
  disabled?: boolean;
}

export default function UserOutperformerToggle({
  userId,
  initialValue,
  onUpdate,
  disabled = false,
}: UserOutperformerToggleProps) {
  const [isOutperformer, setIsOutperformer] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    const newValue = !isOutperformer;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOutperformer: newValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      setIsOutperformer(newValue);
      onUpdate?.(newValue);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
      // Revert on error
      setIsOutperformer(isOutperformer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip
        title={
          isOutperformer
            ? 'Outperformer-Status entfernen (Voraussetzungsprüfung aktivieren)'
            : 'Als Outperformer markieren (Voraussetzungsprüfung überspringen)'
        }
      >
        <FormControlLabel
          control={
            <Switch
              checked={isOutperformer}
              onChange={handleToggle}
              disabled={disabled || loading}
              color='primary'
            />
          }
          label={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              `Outperformer${isOutperformer ? '' : ' (aus)'}`
            )
          }
        />
      </Tooltip>
      {error && (
        <Alert severity='error' sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </>
  );
}
