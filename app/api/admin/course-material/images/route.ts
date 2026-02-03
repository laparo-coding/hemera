/**
 * Image Upload Route
 * Feature: 023-slide-editor
 *
 * Handles image uploads for use in seminar materials
 * Uploads to Vercel Blob and returns public CDN URL
 */

import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import { isAdmin } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { validateImageFile } from '@/lib/utils/file-validator';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
// 4.4 MB limit to stay under Vercel Functions 4.5 MB request body limit
const MAX_FILE_SIZE = 4.4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentifizierung erforderlich',
        },
        { status: 401 }
      );
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: 'Insufficient permissions',
      });
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Datei erforderlich' },
        { status: 400 }
      );
    }

    // Validate file size (before reading content)
    if (file.size > MAX_FILE_SIZE) {
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: `File size ${file.size} exceeds limit ${MAX_FILE_SIZE}`,
      });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Datei darf maximal 5MB groß sein',
        },
        { status: 400 }
      );
    }

    // Server-side file validation: check MIME type and file content
    const validation = await validateImageFile(file, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: validation.error,
      });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: validation.error || 'Ungültiger Dateityp',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.type.split('/')[1];
    const filename = `course-material/images/${timestamp}-${randomId}.${fileExtension}`;

    // Upload to Vercel Blob
    let blob;
    try {
      blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      });
    } catch (blobError) {
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`,
      });
      serverInstance.error('Image blob upload failed', {
        filename,
        fileSize: file.size,
        error: blobError instanceof Error ? blobError.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          error: 'blob_error',
          message: 'Image-Upload zu Blob fehlgeschlagen',
        },
        { status: 502 }
      );
    }

    logAuditEvent('IMAGE_UPLOAD', userId, blob.url, 'image', 'success', {
      details: { filename, sizeBytes: file.size },
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });
  } catch (error) {
    const userId = (await auth()).userId;
    logAuditEvent(
      'IMAGE_UPLOAD',
      userId || 'unknown',
      undefined,
      'image',
      'failure',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    serverInstance.error('Failed to upload image', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Upload' },
      { status: 500 }
    );
  }
}
