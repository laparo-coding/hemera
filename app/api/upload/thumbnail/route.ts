/**
 * Thumbnail Upload API Route
 *
 * Handles course thumbnail uploads to Vercel Blob storage
 * with validation and error handling.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth/admin';
import { uploadThumbnail } from '../../../../lib/utils/fileUpload';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadThumbnail(file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
