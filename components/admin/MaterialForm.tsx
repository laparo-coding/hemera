/**
 * Material Form Component
 * Feature: 023-slide-editor
 *
 * Form for creating/editing seminar materials
 * Collects title, identifier (optional), and HTML content via WYSIWYG editor
 */

'use client';

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { SlideEditor } from './SlideEditor';

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

  const handleEditorChange = useCallback((html: string) => {
    setHtmlContent(html);
  }, []);

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
    <Box component='form' onSubmit={handleSubmit}>
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
          <SlideEditor
            content={initialData?.htmlContent || ''}
            onChange={handleEditorChange}
            placeholder='Beginne mit der Eingabe des Seminarinhalts...'
            disabled={isSubmitting}
            minHeight={400}
          />
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
