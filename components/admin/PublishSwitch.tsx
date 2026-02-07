'use client';

/**
 * PublishSwitch Component
 * Feature: 024-admin-dashboard
 *
 * Switch toggle for publishing/unpublishing courses.
 * Replaces the status column in course list with an interactive toggle.
 * Supports optimistic updates and error rollback.
 */

import {
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { ADMIN_LABELS } from '@/lib/constants/admin';

interface PublishSwitchProps {
  /** Course ID for the toggle action */
  courseId: string;
  /** Current published state */
  isPublished: boolean;
  /** Course title for accessibility label */
  courseTitle: string;
  /** Callback to toggle publish state */
  onToggle: (courseId: string, publish: boolean) => Promise<void>;
  /** Optional: Disable the toggle */
  disabled?: boolean;
}

export function PublishSwitch({
  courseId,
  isPublished,
  courseTitle,
  onToggle,
  disabled = false,
}: PublishSwitchProps) {
  // Optimistic state
  const [optimisticPublished, setOptimisticPublished] = useState(isPublished);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sync with parent prop when it changes (e.g., after server refetch)
  useEffect(() => {
    setOptimisticPublished(isPublished);
  }, [isPublished]);

  const handleToggle = useCallback(async () => {
    const newValue = !optimisticPublished;

    // Optimistic update
    setOptimisticPublished(newValue);
    setError(null);

    startTransition(async () => {
      try {
        await onToggle(courseId, newValue);
      } catch (err) {
        // Rollback on error
        setOptimisticPublished(!newValue);
        setError(
          err instanceof Error ? err.message : 'Fehler beim Aktualisieren'
        );
        // biome-ignore lint/suspicious/noConsole: Error logging for debugging
        console.error('Failed to toggle publish state:', err);
      }
    });
  }, [courseId, optimisticPublished, onToggle]);

  const label = optimisticPublished
    ? ADMIN_LABELS.published
    : ADMIN_LABELS.unpublished;

  const ariaLabel = `${courseTitle} ${optimisticPublished ? 'veröffentlicht' : 'unveröffentlicht'} - Klicken zum Ändern`;

  return (
    <Tooltip
      title={
        error
          ? error
          : optimisticPublished
            ? 'Klicken um Veröffentlichung aufzuheben'
            : 'Klicken um zu veröffentlichen'
      }
      arrow
    >
      <FormControlLabel
        data-testid={`publish-toggle-${courseId}`}
        control={
          <Switch
            checked={optimisticPublished}
            onChange={handleToggle}
            disabled={disabled || isPending}
            inputProps={{
              'aria-label': ariaLabel,
            }}
            color={optimisticPublished ? 'success' : 'default'}
            size='small'
          />
        }
        label={
          isPending ? <CircularProgress size={14} sx={{ ml: 1 }} /> : label
        }
        sx={{
          margin: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.875rem',
            color: error
              ? 'error.main'
              : optimisticPublished
                ? 'success.main'
                : 'text.secondary',
            minWidth: 90,
          },
        }}
      />
    </Tooltip>
  );
}
