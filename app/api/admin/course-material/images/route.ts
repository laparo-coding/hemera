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
import { serverInstance } from '@/lib/monitoring/rollbar-official';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
        { status: 401 }
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

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nur JPEG, PNG, WebP und GIF sind erlaubt',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Datei darf maximal 5MB groß sein',
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
      serverInstance.error('Image blob upload failed', {
        filename,
        fileSize: file.size,
        fileType: file.type,
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

    return NextResponse.json(
      { url: blob.url },
      { status: 200 }
    );
  } catch (error) {
    serverInstance.error('Failed to upload image', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Upload' },
      { status: 500 }
    );
  }
}
