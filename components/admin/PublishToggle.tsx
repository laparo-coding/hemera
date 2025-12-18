/**
 * Publish Toggle Component
 *
 * Toggle button for publishing/unpublishing courses
 */

'use client';

import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { useState } from 'react';

interface PublishToggleProps {
  courseId: string;
  isPublished: boolean;
  onToggle: (courseId: string, publish: boolean) => Promise<void>;
}

export default function PublishToggle({
  courseId,
  isPublished,
  onToggle,
}: PublishToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(courseId, !isPublished);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip
      title={isPublished ? 'Veröffentlichung aufheben' : 'Veröffentlichen'}
    >
      <Button
        size='small'
        variant={isPublished ? 'outlined' : 'contained'}
        color={isPublished ? 'warning' : 'success'}
        onClick={handleToggle}
        disabled={isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} />
          ) : isPublished ? (
            <UnpublishedIcon fontSize='small' />
          ) : (
            <PublishIcon fontSize='small' />
          )
        }
        sx={{ minWidth: 140 }}
      >
        {isLoading
          ? 'Lädt...'
          : isPublished
            ? 'Unveröffentlichen'
            : 'Veröffentlichen'}
      </Button>
    </Tooltip>
  );
}
