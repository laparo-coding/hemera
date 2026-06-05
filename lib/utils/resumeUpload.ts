/**
 * Résumé Upload Utility
 *
 * Handles participant résumé PDF uploads to Vercel Blob storage
 * with validation, single-active file enforcement, and error handling.
 *
 * Rules:
 * - Only PDF files accepted (application/pdf)
 * - Max size: 5MB
 * - Only one active résumé per participation (replacing deactivates previous)
 *
 * Note: Error reporting to Rollbar is handled by client components using logClientError
 */

import { del, put } from '@vercel/blob';
import { sanitizeBlobUrlField } from './log-sanitizer';

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB per docs/development/mux-setup.md
const ALLOWED_MIME_TYPES = ['application/pdf'];

export interface ResumeUploadResult {
  success: boolean;
  blobUrl?: string;
  blobKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  error?: string;
  code?: ResumeUploadErrorCode;
}

export type ResumeUploadErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'BLOB_UPLOAD_FAILED'
  | 'VALIDATION_FAILED';

export interface ResumeDeleteResult {
  success: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate a file before upload
 */
export function validateResumeFile(file: File): {
  valid: boolean;
  error?: string;
  code?: ResumeUploadErrorCode;
} {
  // Check if file is empty
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'Die Datei ist leer.',
      code: 'EMPTY_FILE',
    };
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Ungültiger Dateityp. Nur PDF-Dateien sind erlaubt.`,
      code: 'INVALID_FILE_TYPE',
    };
  }

  // Validate file size
  if (file.size > MAX_RESUME_SIZE) {
    const maxMB = MAX_RESUME_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `Datei zu groß. Maximale Größe: ${maxMB}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  return { valid: true };
}

/**
 * Upload a résumé PDF to Vercel Blob
 *
 * @param file - The PDF file to upload
 * @param participationId - The participation ID for path organization
 * @param userId - The user ID for audit trail
 */
export async function uploadResume(
  file: File,
  participationId: string,
  userId: string
): Promise<ResumeUploadResult> {
  try {
    // Validate file
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        // biome-ignore lint/suspicious/noConsole: Development-only logging
        console.warn('Résumé upload validation failed', {
          participationId,
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: validation.error,
          code: validation.code,
        });
      }

      return {
        success: false,
        error: validation.error,
        code: validation.code,
      };
    }

    // Generate unique filename with participation context
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    const blobKey = `resumes/${participationId}/${timestamp}-${randomString}-${sanitizedName}`;

    // Upload to Vercel Blob
    const blob = await put(blobKey, file, {
      access: 'public', // Required for participant download; consider private with signed URLs later
      addRandomSuffix: false,
    });

    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Development-only logging
      console.info('Résumé uploaded successfully', {
        participationId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        blobUrl: blob.url,
        blobKey,
      });
    }

    return {
      success: true,
      blobUrl: blob.url,
      blobKey,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Development-only logging
      console.error('Failed to upload résumé', error, {
        participationId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        errorMessage,
      });
    }

    return {
      success: false,
      error: 'Datei-Upload fehlgeschlagen. Bitte erneut versuchen.',
      code: 'BLOB_UPLOAD_FAILED',
    };
  }
}

/**
 * Delete a résumé from Vercel Blob
 *
 * Called when replacing a résumé or cleaning up after deactivation
 *
 * @param blobUrl - The Vercel Blob URL to delete
 * @param context - Optional context for logging
 */
export async function deleteResume(
  blobUrl: string,
  context?: {
    participationId?: string;
    userId?: string;
    reason?: string;
  }
): Promise<ResumeDeleteResult> {
  const blobIdentifier = sanitizeBlobUrlField(blobUrl);
  try {
    await del(blobUrl);

    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Development-only logging
      console.info('Résumé deleted successfully', {
        ...blobIdentifier,
        ...context,
      });
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Development-only logging
      console.error('Failed to delete résumé', error, {
        ...blobIdentifier,
        errorMessage,
        ...context,
      });
    }

    return {
      success: false,
      error: 'Datei-Löschung fehlgeschlagen.',
      code: 'BLOB_DELETE_FAILED',
    };
  }
}

/**
 * Get the maximum allowed file size in bytes
 */
export function getMaxResumeSizeBytes(): number {
  return MAX_RESUME_SIZE;
}

/**
 * Get the maximum allowed file size formatted for display
 */
export function getMaxResumeSizeFormatted(): string {
  return `${MAX_RESUME_SIZE / (1024 * 1024)}MB`;
}

/**
 * Get allowed MIME types for résumé uploads
 */
export function getAllowedResumeMimeTypes(): readonly string[] {
  return ALLOWED_MIME_TYPES;
}
