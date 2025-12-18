/**
 * File Upload Component for Course Thumbnails
 *
 * Client-side component for uploading thumbnail images
 * with preview and validation.
 */

'use client';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string | null;
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
      setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    // Show preview
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
        throw new Error(data.error || 'Upload failed');
      }

      onUploadComplete(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
      setPreview(null);
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
        {uploading ? 'Uploading...' : 'Upload Thumbnail'}
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

      {preview && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            aspectRatio: '16/9',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'grey.100',
          }}
        >
          <img
            src={preview}
            alt='Thumbnail preview'
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      )}

      {!preview && (
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
            <Typography variant='body2'>No thumbnail uploaded</Typography>
          </Box>
        </Box>
      )}

      <Typography variant='caption' color='text.secondary'>
        Accepted formats: JPEG, PNG, WebP (max 10MB)
      </Typography>
    </Box>
  );
}
