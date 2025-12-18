/**
 * File Upload Utility for Course Thumbnails
 *
 * Handles thumbnail image uploads to Vercel Blob storage
 * with validation and error handling.
 */

import { put } from '@vercel/blob';
import { serverInstance as rollbar } from '../monitoring/rollbar-official';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  code?: string;
}

/**
 * Upload a thumbnail image to Vercel Blob
 */
export async function uploadThumbnail(file: File): Promise<UploadResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE',
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `course-thumbnails/${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return {
      success: true,
      url: blob.url,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    rollbar.error('Failed to upload thumbnail', error as Error, {
      action: 'upload',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    return {
      success: false,
      error: 'Failed to upload file. Please try again.',
      code: 'BLOB_UPLOAD_FAILED',
    };
  }
}

/**
 * Delete a thumbnail from Vercel Blob (cleanup)
 */
export async function deleteThumbnail(url: string): Promise<boolean> {
  try {
    // Vercel Blob delete API would go here
    // For now, just log the deletion request
    rollbar.info('Thumbnail deletion requested', {
      action: 'delete',
      url,
    });
    return true;
  } catch (error) {
    rollbar.error('Failed to delete thumbnail', error as Error, {
      action: 'delete',
      url,
    });
    return false;
  }
}

/**
 * Validate thumbnail URL is from Vercel Blob
 */
export function isValidThumbnailUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('vercel-storage.com');
  } catch {
    return false;
  }
}
