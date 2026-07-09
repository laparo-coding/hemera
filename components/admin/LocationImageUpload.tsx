/**
 * Location Image Upload Component
 *
 * Client-side component for uploading location images
 * with clickable thumbnail preview for upload.
 * Supports exterior and room images.
 */

'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useRef, useState } from 'react';

interface LocationImageUploadProps {
  /** Callback when upload completes with image URL */
  onUploadComplete: (url: string) => void;
  /** Current image URL for preview */
  currentUrl?: string | null;
  /** Disable upload */
  disabled?: boolean;
  /** Image type for storage organization */
  imageType?: 'exterior' | 'room';
  /** Label for the upload area */
  label?: string;
}

export default function LocationImageUpload({
  onUploadComplete,
  currentUrl,
  disabled = false,
  imageType = 'exterior',
  label = 'Bild hochladen',
}: LocationImageUploadProps) {
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
      formData.append('imageType', imageType);

      const response = await fetch('/api/upload/location-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      // Update preview with uploaded image
      setPreview(data.url);

      onUploadComplete(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload fehlgeschlagen. Bitte versuche es erneut.'
      );
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        hidden
        accept='image/jpeg,image/png,image/webp'
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      <Typography variant='subtitle2' color='text.secondary'>
        {label}
      </Typography>

      {error && (
        <Alert
          severity='error'
          onClose={() => {
            setError(null);
          }}
        >
          {error}
        </Alert>
      )}

      {/* Clickable Image Preview / Upload Area */}
      <Box
        onClick={handleClick}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 300,
          aspectRatio: '4 / 3',
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
        {preview ? (
          <Image
            src={preview}
            alt='Location Vorschau'
            fill
            style={{ objectFit: 'cover' }}
            sizes='300px'
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant='body2'>Klicke zum Hochladen</Typography>
            <Typography variant='caption' color='text.disabled'>
              JPEG, PNG oder WebP (max. 10MB)
            </Typography>
          </Box>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Box>
  );
}
