/**
 * Image Upload Route
 * Feature: 023-slide-editor
 *
 * Handles image uploads for use in course materials
 * Uploads to Vercel Blob and returns public CDN URL
 */

import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { validateImageFile } from '@/lib/utils/file-validator';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
// 4.4 MB limit to stay under Vercel Functions 4.5 MB request body limit
const MAX_FILE_SIZE = 4.4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  let userId: string | null = null;
  try {
    const auth = await requireAdminUser(requestId);
    if (!auth.authorized) return auth.response;
    userId = auth.userId;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'validation_error', message: 'Ungültiges Formular-Format' },
        { status: 400 }
      );
    }
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
        details: { requestId },
      });
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Datei darf maximal 4,4 MB groß sein',
        },
        { status: 400 }
      );
    }

    // Server-side file validation: check MIME type and file content
    const validation = await validateImageFile(file, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: validation.error,
        details: { requestId },
      });
      return NextResponse.json(
        {
          error: 'validation_error',
          message:
            'Ungültige Bilddatei. Bitte überprüfe das Format und versuche es erneut.',
        },
        { status: 400 }
      );
    }

    // MIME type to file extension mapping
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExtension = MIME_TO_EXT[file.type] || 'bin';
    const filename = `course-material/images/${timestamp}-${randomId}.${fileExtension}`;

    // Upload to Vercel Blob
    let blob;
    try {
      blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      });
    } catch (blobError) {
      const blobErrorMessage =
        blobError instanceof Error ? blobError.message : 'Unknown error';
      logAuditEvent('IMAGE_UPLOAD', userId, undefined, 'image', 'failure', {
        error: `Blob upload failed: ${blobErrorMessage}`,
        details: { requestId },
      });
      serverInstance.error('Image blob upload failed', {
        requestId,
        filename,
        fileSize: file.size,
        tokenAvailable: !!process.env.BLOB_READ_WRITE_TOKEN,
        error: blobErrorMessage,
      });
      return NextResponse.json(
        {
          error: 'blob_error',
          message: 'Bild-Upload fehlgeschlagen',
        },
        { status: 502 }
      );
    }

    logAuditEvent('IMAGE_UPLOAD', userId, blob.url, 'image', 'success', {
      details: { requestId, filename, sizeBytes: file.size },
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });
  } catch (error) {
    const auditUserId = userId ?? 'unknown';
    logAuditEvent('IMAGE_UPLOAD', auditUserId, undefined, 'image', 'failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { requestId },
    });
    serverInstance.error('Failed to upload image', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Upload' },
      { status: 500 }
    );
  }
}
