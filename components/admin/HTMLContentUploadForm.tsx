/**
 * HTMLContentUploadForm Component
 * Feature: 030-extended-material-upload
 *
 * Form for uploading complete HTML content files as CONTENT materials.
 * Reuses the shared useFileUpload hook (drag-and-drop, validation, size
 * formatting) together with SlideControlUploadForm (Feature 026).
 * Uploaded HTML is stored as-is in Vercel Blob under course-material/content/.
 */

'use client';

import {
  CloudUploadOutlined,
  DeleteOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import { colors } from '@/lib/design-tokens';
import { formatFileSize, useFileUpload } from '@/lib/hooks/useFileUpload';
import { MAX_FILE_SIZE } from '@/lib/schemas/admin/course-material';

interface HTMLContentUploadFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  /** True when a parent is handling submission */
  submitting?: boolean;
}

export default function HTMLContentUploadForm({
  onSubmit,
  onCancel,
  submitting: externalSubmitting,
}: HTMLContentUploadFormProps) {
  const [title, setTitle] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const isLoading = submitting || !!externalSubmitting;

  const {
    selectedFile,
    dragOver,
    fileInputRef,
    error,
    setError,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleBrowseClick,
  } = useFileUpload({ isLoading });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setTitleError(null);

    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('Titel ist erforderlich');
      return;
    }
    if (trimmedTitle.length > 200) {
      setTitleError('Titel darf maximal 200 Zeichen lang sein');
      return;
    }

    // File is required for upload
    if (!selectedFile) {
      setError('Eine .html-Datei ist erforderlich');
      return;
    }

    const formData = new FormData();
    formData.append('title', trimmedTitle);
    if (identifier.trim()) {
      formData.append('identifier', identifier.trim());
    }
    formData.append('file', selectedFile);
    formData.append('type', 'CONTENT');

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label='Titel'
        value={title}
        onChange={e => {
          setTitle(e.target.value);
          setTitleError(null);
        }}
        fullWidth
        required
        error={!!titleError}
        helperText={titleError || `${title.length}/200`}
        slotProps={{ htmlInput: { maxLength: 200 } }}
        sx={{ mb: 3 }}
        disabled={isLoading}
      />

      <TextField
        label='Identifier (optional)'
        value={identifier}
        onChange={e => {
          setIdentifier(e.target.value);
        }}
        fullWidth
        helperText='Wird automatisch aus dem Titel generiert, falls leer gelassen'
        sx={{ mb: 3 }}
        disabled={isLoading}
      />

      <input
        ref={fileInputRef}
        type='file'
        accept='.html,text/html'
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label='HTML-Datei auswählen'
      />

      {selectedFile ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            border: `1px solid ${colors.bronze}`,
            borderRadius: 1,
            bgcolor: colors.bronzeLight,
            mb: 2,
          }}
        >
          <DescriptionOutlined sx={{ color: colors.bronze }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              {selectedFile.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {formatFileSize(selectedFile.size)}
            </Typography>
          </Box>
          <Button
            size='small'
            onClick={handleRemoveFile}
            disabled={isLoading}
            startIcon={<DeleteOutlined />}
            aria-label='Datei entfernen'
          >
            Entfernen
          </Button>
        </Box>
      ) : (
        <Box
          onClick={handleBrowseClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${dragOver ? colors.bronze : colors.bronzeLight}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            bgcolor: dragOver ? colors.bronzeLight : 'background.paper',
            transition: 'border-color 0.2s, background-color 0.2s',
            '&:hover': {
              borderColor: colors.bronze,
              bgcolor: colors.bronzeLight,
            },
            '&:focus-visible': {
              outline: `2px solid ${colors.bronze}`,
              outlineOffset: 2,
            },
          }}
          role='button'
          tabIndex={0}
          aria-label='HTML-Datei per Drag-and-Drop hochladen oder klicken zum Auswählen'
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBrowseClick();
            }
          }}
        >
          <CloudUploadOutlined
            sx={{ fontSize: 48, color: colors.bronze, mb: 1 }}
          />
          <Typography variant='body1' sx={{ fontWeight: 500, mb: 0.5 }}>
            HTML-Datei hierher ziehen
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            oder klicken zum Auswählen
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mt: 1, display: 'block' }}
          >
            Nur .html-Dateien, max. {MAX_FILE_SIZE / 1024 / 1024} MB
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isLoading} variant='outlined'>
          Abbrechen
        </Button>
        <Button
          type='submit'
          variant='contained'
          disabled={isLoading || !selectedFile}
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color='inherit' />
            ) : undefined
          }
        >
          {isLoading ? 'Wird hochgeladen...' : 'Speichern'}
        </Button>
      </Box>
    </Box>
  );
}
