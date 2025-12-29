/**
 * File Upload Component for Course Images
 *
 * Client-side component for uploading course images
 * with clickable thumbnail preview for upload.
 */

'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useRef, useState } from 'react';

export interface CourseImageUrls {
  thumbnail: string;
  detail: string;
  twitter: string;
  original: string;
}

interface FileUploadProps {
  /** Callback when upload completes with all image URLs */
  onUploadComplete: (urls: CourseImageUrls) => void;
  /** Current thumbnail URL for preview */
  currentUrl?: string | null;
  /** Current Twitter image URL for preview (kept for API compatibility) */
  currentTwitterUrl?: string | null;
  /** Disable upload */
  disabled?: boolean;
}

export default function FileUpload({
  onUploadComplete,
  currentUrl,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Ungültiger Dateityp. Bitte lade ein JPEG, PNG oder WebP hoch.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Datei zu groß. Maximale Größe ist 10MB.');
      return;
    }

    // Show preview of original
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      // Update preview with generated thumbnail
      setPreview(data.urls.thumbnail);

      onUploadComplete(data.urls);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload fehlgeschlagen. Bitte versuche es erneut.'
      );
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        hidden
        accept='image/jpeg,image/png,image/webp'
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Clickable Thumbnail Preview / Upload Area */}
      <Box
        onClick={handleClick}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          aspectRatio: '4.5 / 1',
          border: preview ? '1px solid' : '2px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'grey.100',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled || uploading ? 'divider' : 'primary.main',
            backgroundColor:
              disabled || uploading ? 'grey.100' : 'action.hover',
          },
        }}
      >
        {uploading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : preview ? (
          <Image
            src={preview}
            alt='Thumbnail Vorschau'
            fill
            style={{
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 32, mr: 1 }} />
            <Typography variant='body2'>Klicken zum Hochladen</Typography>
          </Box>
        )}
      </Box>

      <Typography variant='caption' color='text.secondary'>
        Akzeptierte Formate: JPEG, PNG, WebP (max 10MB). Das Bild wird
        automatisch optimiert.
      </Typography>
    </Box>
  );
}
