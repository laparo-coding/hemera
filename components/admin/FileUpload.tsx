/**
 * File Upload Component for Course Images
 *
 * Client-side component for uploading course images
 * with preview of all generated variants (thumbnail, detail, twitter).
 */

'use client';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';

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
  /** Current Twitter image URL for preview */
  currentTwitterUrl?: string | null;
  /** Disable upload button */
  disabled?: boolean;
}

export default function FileUpload({
  onUploadComplete,
  currentUrl,
  currentTwitterUrl,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [twitterPreview, setTwitterPreview] = useState<string | null>(
    currentTwitterUrl || null
  );
  const [error, setError] = useState<string | null>(null);

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

      // Update previews with generated variants
      setPreview(data.urls.thumbnail);
      setTwitterPreview(data.urls.twitter);

      onUploadComplete(data.urls);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload fehlgeschlagen. Bitte versuche es erneut.'
      );
      setPreview(null);
      setTwitterPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        component='label'
        variant='outlined'
        startIcon={
          uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />
        }
        disabled={disabled || uploading}
        fullWidth
      >
        {uploading ? 'Wird hochgeladen...' : 'Kursbild hochladen'}
        <input
          type='file'
          hidden
          accept='image/jpeg,image/png,image/webp'
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
      </Button>

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Thumbnail Preview */}
      {preview && (
        <Box>
          <Typography variant='subtitle2' gutterBottom>
            Thumbnail (Kursübersicht)
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              aspectRatio: '4.5 / 1',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: 'grey.100',
            }}
          >
            <Image
              src={preview}
              alt='Thumbnail Vorschau'
              fill
              style={{
                objectFit: 'cover',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Twitter Card Preview */}
      {twitterPreview && (
        <Card variant='outlined' sx={{ maxWidth: 500 }}>
          <CardContent sx={{ pb: 1 }}>
            <Typography variant='subtitle2' gutterBottom>
              Twitter Card Vorschau
            </Typography>
          </CardContent>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1200 / 630',
              backgroundColor: 'grey.100',
            }}
          >
            <Image
              src={twitterPreview}
              alt='Twitter Card Vorschau'
              fill
              style={{
                objectFit: 'cover',
              }}
            />
          </Box>
          <CardContent>
            <Typography variant='caption' color='text.secondary'>
              So erscheint dein Kurs in Twitter/X Shares (summary_large_image)
            </Typography>
          </CardContent>
        </Card>
      )}

      {!preview && !twitterPreview && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 400,
            aspectRatio: '16/9',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'grey.50',
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant='body2'>Kein Bild hochgeladen</Typography>
          </Box>
        </Box>
      )}

      <Typography variant='caption' color='text.secondary'>
        Akzeptierte Formate: JPEG, PNG, WebP (max 10MB). Das Bild wird
        automatisch in drei Größen optimiert: Thumbnail (400×90), Detail
        (900×200) und Twitter Card (1200×630).
      </Typography>
    </Box>
  );
}
