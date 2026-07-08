/**
 * SlideControlUploadForm Component
 *
 * Form for creating/editing SLIDE_CONTROL course materials.
 * Uses the shared useFileUpload hook (drag-and-drop, validation, size
 * formatting) together with HTMLContentUploadForm (Feature 030).
 * Supports create mode (no initialData) and edit mode (with initialData).
 */

'use client';

import {
  CloudUploadOutlined,
  DeleteOutlined,
  DescriptionOutlined,
  DownloadOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import { colors } from '@/lib/design-tokens';
import { formatFileSize, useFileUpload } from '@/lib/hooks/useFileUpload';
import { MAX_FILE_SIZE } from '@/lib/schemas/admin/course-material';

/** Data passed via initialData in edit mode */
export interface SlideControlInitialData {
  title: string;
  identifier: string;
  blobPathname?: string | null;
  blobUrl?: string | null;
}

interface SlideControlUploadFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  initialData?: SlideControlInitialData;
  /** True when a parent is handling submission */
  submitting?: boolean;
}

export default function SlideControlUploadForm({
  onSubmit,
  onCancel,
  initialData,
  submitting: externalSubmitting,
}: SlideControlUploadFormProps) {
  const isEditMode = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [identifier, setIdentifier] = useState(initialData?.identifier ?? '');
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

    // In create mode, file is required
    if (!isEditMode && !selectedFile) {
      setError('Eine .html-Datei ist erforderlich');
      return;
    }

    const formData = new FormData();
    formData.append('title', trimmedTitle);
    if (identifier.trim()) {
      formData.append('identifier', identifier.trim());
    }
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('type', 'SLIDE_CONTROL');

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
        onChange={e => setIdentifier(e.target.value)}
        fullWidth
        helperText='Wird automatisch aus dem Titel generiert, wenn leer'
        sx={{ mb: 3 }}
        disabled={isLoading}
      />

      {/* Current file in edit mode */}
      {isEditMode && initialData?.blobUrl && !selectedFile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: colors.beige,
          }}
        >
          <DescriptionOutlined sx={{ color: colors.bronze }} />
          <Typography variant='body2' sx={{ flex: 1 }}>
            {initialData.blobPathname?.split('/').pop() || 'Aktuelle Datei'}
          </Typography>
          <Button
            size='small'
            startIcon={<DownloadOutlined />}
            href={initialData.blobUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            Herunterladen
          </Button>
        </Box>
      )}

      {/* Drag-and-drop upload zone */}
      <Box
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role='button'
        tabIndex={0}
        aria-label={
          isEditMode
            ? 'Datei ersetzen — .html-Datei hierher ziehen oder klicken'
            : '.html-Datei hierher ziehen oder klicken'
        }
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: dragOver ? colors.bronze : 'divider',
          borderRadius: 2,
          backgroundColor: dragOver ? colors.bronzeLight : colors.beige,
          textAlign: 'center',
          cursor: isLoading ? 'default' : 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': !isLoading
            ? {
                borderColor: colors.bronze,
                backgroundColor: colors.bronzeLight,
              }
            : {},
          '&:focus-visible': {
            outline: `2px solid ${colors.bronze}`,
            outlineOffset: 2,
          },
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? (
          <Box>
            <CircularProgress
              size={40}
              aria-label='Datei wird hochgeladen'
              sx={{ color: colors.bronze, mb: 1 }}
            />
            <LinearProgress sx={{ mt: 2, maxWidth: 300, mx: 'auto' }} />
          </Box>
        ) : (
          <Box>
            <CloudUploadOutlined
              sx={{ fontSize: 48, color: colors.bronze, mb: 1 }}
            />
            <Typography variant='body1' sx={{ fontWeight: 500 }}>
              {isEditMode ? 'Datei ersetzen' : '.html-Datei hierher ziehen'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              oder klicken zum Auswählen (max. {MAX_FILE_SIZE / 1024 / 1024} MB)
            </Typography>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type='file'
        accept='.html'
        onChange={handleFileChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />

      {/* Selected file display */}
      {selectedFile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <DescriptionOutlined sx={{ color: colors.bronze }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              {selectedFile.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {formatFileSize(selectedFile.size)}
            </Typography>
          </Box>
          <Button
            size='small'
            color='error'
            startIcon={<DeleteOutlined />}
            onClick={handleRemoveFile}
            disabled={isLoading}
          >
            Entfernen
          </Button>
        </Box>
      )}

      {/* Actions — same layout as CourseForm / MaterialForm */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          alignItems: 'center',
          mt: 2,
        }}
      >
        <Button
          variant='outlined'
          color='primary'
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
        <Button
          type='submit'
          variant='contained'
          color='primary'
          disabled={isLoading}
          aria-busy={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </Box>
    </Box>
  );
}
