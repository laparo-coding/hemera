/**
 * SlideControlUploadForm Component
 *
 * Form for creating/editing SLIDE_CONTROL course materials.
 * Uses drag-and-drop file upload pattern from ResumeUploader.
 * Supports create mode (no initialData) and edit mode (with initialData).
 */

'use client';

import {
  ArrowBackOutlined,
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
  TextField,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { colors } from '@/lib/design-tokens';
import {
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
} from '@/lib/schemas/admin/course-material';

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoading = submitting || !!externalSubmitting;

  const validateFile = useCallback((file: File): string | null => {
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      return 'Nur .html-Dateien sind erlaubt';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Datei darf maximal ${MAX_FILE_SIZE / 1024 / 1024} MB groß sein`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

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
            component='a'
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

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          type='submit'
          variant='contained'
          disabled={isLoading}
          sx={{
            backgroundColor: colors.bronze,
            '&:hover': { backgroundColor: colors.bronzeHover },
          }}
        >
          {isLoading ? (
            <CircularProgress
              size={24}
              sx={{ color: 'white' }}
              aria-label='Ladevorgang läuft'
              role='status'
            />
          ) : isEditMode ? (
            'Speichern'
          ) : (
            'Steuerdatei anlegen'
          )}
        </Button>
        <Button
          variant='outlined'
          onClick={onCancel}
          disabled={isLoading}
          startIcon={<ArrowBackOutlined />}
        >
          Abbrechen
        </Button>
      </Box>
    </Box>
  );
}
