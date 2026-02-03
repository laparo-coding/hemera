/**
 * Material Form Component
 * Feature: 023-slide-editor
 *
 * Form for creating/editing seminar materials
 * Collects title, identifier (optional), and HTML content
 */

'use client';

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface MaterialFormProps {
  onSubmit: (data: {
    title: string;
    identifier?: string;
    htmlContent: string;
  }) => Promise<void>;
  initialData?: {
    title?: string;
    identifier?: string;
    htmlContent?: string;
  };
}

export function MaterialForm({ onSubmit, initialData }: MaterialFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [identifier, setIdentifier] = useState(initialData?.identifier || '');
  const [htmlContent, setHtmlContent] = useState(
    initialData?.htmlContent || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        identifier: identifier || undefined,
        htmlContent,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ maxWidth: 800 }}>
      <Stack spacing={3}>
        {error && (
          <Box
            role='alert'
            sx={{
              p: 2,
              bgcolor: 'error.light',
              color: 'error.dark',
              borderRadius: 1,
            }}
          >
            {error}
          </Box>
        )}

        <TextField
          label='Titel'
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          required
          placeholder='z.B. Einführung in Grundkurs'
          inputProps={{ maxLength: 200 }}
          helperText={`${title.length}/200`}
          disabled={isSubmitting}
        />

        <TextField
          label='Kennung (optional)'
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          fullWidth
          placeholder='z.B. einfuehrung-grundkurs (Auto-generiert falls leer)'
          helperText='Eindeutige URL-freundliche Bezeichnung. Wird automatisch generiert falls leer.'
          disabled={isSubmitting}
        />

        <Box>
          <TextField
            id='html-content'
            label='HTML-Inhalt'
            value={htmlContent}
            onChange={e => setHtmlContent(e.target.value)}
            fullWidth
            multiline
            rows={10}
            placeholder='<h1>Titel</h1><p>Inhalt...</p>'
            required
            disabled={isSubmitting}
            InputProps={{
              sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
            }}
          />
          <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
            HTML wird später im WYSIWYG-Editor editierbar sein
          </Typography>
        </Box>

        <Button
          type='submit'
          variant='contained'
          disabled={isSubmitting || !title || !htmlContent}
          aria-busy={isSubmitting}
          sx={{ alignSelf: 'flex-start' }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Wird gespeichert...
            </>
          ) : (
            'Speichern'
          )}
        </Button>
      </Stack>
    </Box>
  );
}
