'use client';

/**
 * AdminTableEmptyState Component
 * Feature: 024-admin-dashboard
 *
 * Displays empty state message when table has no data
 * or search returns no results.
 */

import { Inbox as InboxIcon } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import type { AdminTableEmptyStateConfig } from './types';

interface AdminTableEmptyStateProps {
  config: AdminTableEmptyStateConfig;
  isSearchEmpty?: boolean;
}

export default function AdminTableEmptyState({
  config,
  isSearchEmpty = false,
}: AdminTableEmptyStateProps) {
  const title = isSearchEmpty
    ? config.searchEmptyTitle || 'Keine Ergebnisse gefunden'
    : config.title;

  const description = isSearchEmpty
    ? config.searchEmptyDescription || 'Versuche einen anderen Suchbegriff'
    : config.description;

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ mb: 2 }}>
        {config.icon || (
          <InboxIcon
            sx={{
              fontSize: 64,
              color: 'text.disabled',
            }}
          />
        )}
      </Box>

      <Typography variant='h6' color='text.secondary' gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant='body2' color='text.disabled' sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}

      {config.action && !isSearchEmpty && (
        <Button
          variant='contained'
          onClick={config.action.onClick}
          sx={{ mt: 1 }}
        >
          {config.action.label}
        </Button>
      )}
    </Paper>
  );
}
