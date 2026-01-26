/**
 * Thumbnail Upload API Route
 *
 * Handles course image uploads to Vercel Blob storage
 * with automatic generation of multiple image variants:
 * - thumbnail (400x90) for Landing CourseCard
 * - detail (900x200) for Course Detail page
 * - twitter (1200x630) for Twitter Card SEO
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth/admin';
import { ErrorSeverity, reportError } from '../../../../lib/monitoring/rollbar';
import { uploadCourseImage } from '../../../../lib/utils/courseImageUpload';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadCourseImage(file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      urls: result.urls,
      // For backwards compatibility with existing code
      url: result.urls?.thumbnail,
    });
  } catch (error) {
    reportError(
      error instanceof Error ? error : 'Upload error',
      { additionalData: { operation: 'thumbnail-upload' } },
      ErrorSeverity.ERROR
    );
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
