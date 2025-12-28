/**
 * Resume Upload/Delete API Route
 *
 * POST - Upload a new resume (replaces any existing active one)
 * DELETE - Remove the active resume
 * GET - Get active resume metadata
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
  createResumeDocument,
  deactivateResumeDocument,
  getActiveResume,
  getParticipationByBookingId,
} from '../../../../../lib/db/courseParticipation';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';
import {
  deleteResume,
  uploadResume,
} from '../../../../../lib/utils/resumeUpload';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      );
    }

    const activeResume = await getActiveResume(participation.id);

    return NextResponse.json({
      success: true,
      data: activeResume
        ? {
            id: activeResume.id,
            fileName: activeResume.fileName,
            fileSizeBytes: activeResume.fileSizeBytes,
            uploadedAt: activeResume.uploadedAt,
            blobUrl: activeResume.blobUrl,
          }
        : null,
    });
  } catch (error) {
    serverInstance.error('Error in GET /api/my-courses/[bookingId]/resume', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized resume upload attempt', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const uploadResult = await uploadResume(file, participation.id, userId);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error, code: uploadResult.code },
        { status: 400 }
      );
    }

    // Save to database (handles deactivating previous)
    const document = await createResumeDocument({
      participationId: participation.id,
      blobUrl: uploadResult.blobUrl!,
      blobKey: uploadResult.blobKey!,
      fileName: uploadResult.fileName!,
      fileSizeBytes: uploadResult.fileSizeBytes!,
      mimeType: uploadResult.mimeType!,
      createdByUserId: userId,
    });

    serverInstance.info('Resume uploaded successfully', {
      userId,
      bookingId,
      participationId: participation.id,
      documentId: document.id,
      fileName: document.fileName,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        fileName: document.fileName,
        fileSizeBytes: document.fileSizeBytes,
        uploadedAt: document.uploadedAt,
        blobUrl: document.blobUrl,
      },
    });
  } catch (error) {
    serverInstance.error('Error in POST /api/my-courses/[bookingId]/resume', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      );
    }

    const activeResume = await getActiveResume(participation.id);

    if (!activeResume) {
      return NextResponse.json(
        { error: 'No active resume found' },
        { status: 404 }
      );
    }

    // Delete from Vercel Blob
    await deleteResume(activeResume.blobUrl, {
      participationId: participation.id,
      userId,
      reason: 'User requested deletion via API',
    });

    // Deactivate in database
    await deactivateResumeDocument(activeResume.id);

    serverInstance.info('Resume deleted successfully', {
      userId,
      bookingId,
      participationId: participation.id,
      documentId: activeResume.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Resume deleted',
    });
  } catch (error) {
    serverInstance.error('Error in DELETE /api/my-courses/[bookingId]/resume', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
