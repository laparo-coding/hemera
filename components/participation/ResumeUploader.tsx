/**
 * Résumé Uploader Component
 *
 * Provides drag-and-drop and click-to-upload interface for participant résumés.
 * Enforces single-active résumé rule with replace/delete functionality.
 * Shows upload progress and current file status.
 */

'use client';

import {
  CloudUploadOutlined,
  DeleteOutlined,
  DescriptionOutlined,
  RefreshOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { colors } from '@/lib/design-tokens';
import {
  deleteResumeAction,
  getActiveResumeAction,
  uploadResumeAction,
} from '../../lib/actions/participation';
import {
  getAllowedResumeMimeTypes,
  getMaxResumeSizeFormatted,
} from '../../lib/utils/resumeUpload';

interface ResumeInfo {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: Date | string;
  blobUrl: string;
}

interface ResumeUploaderProps {
  bookingId: string;
  onUploadComplete?: (resume: ResumeInfo) => void;
  onDeleteComplete?: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  bookingId,
  onUploadComplete,
  onDeleteComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResume, setCurrentResume] = useState<ResumeInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current résumé
  const loadResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveResumeAction(bookingId);
      if (result.success) {
        setCurrentResume(result.data || null);
      } else {
        setError(result.error?.message || 'Fehler beim Laden');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const result = await uploadResumeAction(bookingId, formData);
        if (result.success && result.data) {
          const newResume: ResumeInfo = {
            id: result.data.blobKey || '',
            fileName: result.data.fileName || file.name,
            fileSizeBytes: result.data.fileSizeBytes || file.size,
            uploadedAt: new Date().toISOString(),
            blobUrl: result.data.blobUrl || '',
          };
          setCurrentResume(newResume);
          onUploadComplete?.(newResume);
        } else {
          setError(result.error?.message || 'Upload fehlgeschlagen');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      } finally {
        setUploading(false);
      }
    },
    [bookingId, onUploadComplete]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!currentResume) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteResumeAction(bookingId);
      if (result.success) {
        setCurrentResume(null);
        onDeleteComplete?.();
      } else {
        setError(result.error?.message || 'Löschen fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setDeleting(false);
    }
  }, [bookingId, currentResume, onDeleteComplete]);

  // File input change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
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
      // Validate file type
      if (!getAllowedResumeMimeTypes().includes(file.type)) {
        setError('Nur PDF-Dateien sind erlaubt');
        return;
      }
      handleUpload(file);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <CircularProgress sx={{ color: colors.marsala }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='.pdf,application/pdf'
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {currentResume ? (
        // Current résumé display
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${colors.rosyBrown}`,
            borderRadius: 2,
            backgroundColor: colors.white,
          }}
        >
          <CardContent>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
            >
              <Box display='flex' alignItems='center' gap={2}>
                <DescriptionOutlined
                  sx={{ fontSize: 40, color: colors.marsala }}
                />
                <Box>
                  <Typography
                    variant='subtitle1'
                    sx={{ color: colors.marsala }}
                  >
                    {currentResume.fileName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {formatFileSize(currentResume.fileSizeBytes)} • Hochgeladen
                    am{' '}
                    {new Date(currentResume.uploadedAt).toLocaleDateString(
                      'de-DE'
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box display='flex' gap={1}>
                <Tooltip title='Ersetzen'>
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{ color: colors.marsala }}
                  >
                    {uploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <RefreshOutlined />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title='Löschen'>
                  <IconButton
                    onClick={handleDelete}
                    disabled={deleting}
                    // Design decision: rosyPink provides a soft destructive cue
                    // consistent with the Hemera warm color palette
                    sx={{ color: colors.rosyPink }}
                  >
                    {deleting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteOutlined />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Download link */}
            <Button
              href={currentResume.blobUrl}
              target='_blank'
              rel='noopener noreferrer'
              variant='outlined'
              size='small'
              sx={{
                mt: 2,
                borderColor: colors.marsala,
                color: colors.marsala,
                '&:hover': {
                  borderColor: colors.bronze,
                  backgroundColor: colors.bronzeLight,
                },
              }}
            >
              PDF anzeigen
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Upload area
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          sx={{
            border: 'none',
            borderRadius: 2,
            backgroundColor: dragOver ? colors.bronzeLight : colors.beige,
            p: 4,
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.bronzeHoverLight,
            },
          }}
        >
          {uploading ? (
            <Box>
              <CircularProgress sx={{ color: colors.marsala, mb: 2 }} />
              <Typography variant='body1' sx={{ color: colors.lightBlack }}>
                Wird hochgeladen...
              </Typography>
              <LinearProgress
                sx={{
                  mt: 2,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.bronze,
                  },
                }}
              />
            </Box>
          ) : (
            <>
              <CloudUploadOutlined
                sx={{ fontSize: 48, color: colors.rosyBrown, mb: 2 }}
              />
              <Typography variant='h6' sx={{ color: colors.marsala, mb: 1 }}>
                Lebenslauf hochladen
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Klicken oder PDF-Datei hierher ziehen
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 1, display: 'block' }}
              >
                Maximal {getMaxResumeSizeFormatted()} • Nur PDF-Dateien
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Info text */}
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mt: 2, display: 'block' }}
      >
        💡 Es kann immer nur ein Lebenslauf aktiv sein. Beim Hochladen eines
        neuen wird der vorherige ersetzt.
      </Typography>
    </Box>
  );
};

export default ResumeUploader;
