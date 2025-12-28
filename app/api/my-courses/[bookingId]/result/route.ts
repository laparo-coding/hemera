/**
 * Result Step API Route
 *
 * GET - Retrieve result data for a booking
 * PUT - Update result data (save/complete - final step)
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  completeResultStep,
  getParticipationByBookingId,
  updateResult,
} from '../../../../../lib/db/courseParticipation';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';

// Zod schema for result input
const resultSchema = z.object({
  resultOutcome: z.string().max(2000).optional(),
  resultNotes: z.string().max(2000).optional(),
  complete: z.boolean().optional(),
});

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
      serverInstance.warning('Unauthorized result access', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        resultOutcome: participation.resultOutcome,
        resultNotes: participation.resultNotes,
        resultCompletedAt: participation.resultCompletedAt,
        status: participation.status,
        isComplete: participation.status === 'COMPLETE',
      },
    });
  } catch (error) {
    serverInstance.error('Error in GET /api/my-courses/[bookingId]/result', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Parse and validate body
    const body = await request.json();
    const parseResult = resultSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { complete, ...resultData } = parseResult.data;

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized result update', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json(
        { error: 'No permission' },
        { status: 403 }
      );
    }

    // Update result data
    await updateResult(participation.id, resultData);

    // If completing, mark entire participation as complete
    if (complete) {
      await completeResultStep(participation.id);
      serverInstance.info('Participation completed', {
        userId,
        bookingId,
        participationId: participation.id,
        courseTitle: participation.booking.course.title,
      });
    }

    return NextResponse.json({
      success: true,
      message: complete ? 'Participation completed' : 'Data saved',
    });
  } catch (error) {
    serverInstance.error('Error in PUT /api/my-courses/[bookingId]/result', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
