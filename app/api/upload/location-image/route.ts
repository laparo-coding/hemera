/**
 * Location Image Upload API Route
 *
 * Handles location image uploads to Vercel Blob storage
 * with automatic optimization and WebP conversion.
 *
 * Supports two image types:
 * - exterior: Building/venue exterior image
 * - room: Training room/interior image
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth/admin';
import { uploadLocationImage } from '../../../../lib/utils/locationImageUpload';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = (formData.get('imageType') as string) || 'exterior';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate imageType
    if (imageType !== 'exterior' && imageType !== 'room') {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "exterior" or "room"' },
        { status: 400 }
      );
    }

    const result = await uploadLocationImage(file, imageType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error('Location image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
