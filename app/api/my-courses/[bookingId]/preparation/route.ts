/**
 * Preparation Step API Route
 *
 * GET - Retrieve preparation data for a booking
 * PUT - Update preparation data (save/complete)
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  completePreparationStep,
  getParticipationByBookingId,
  updatePreparation,
} from '../../../../../lib/db/courseParticipation';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';

// Zod schema for preparation input
const preparationSchema = z.object({
  preparationIntent: z.string().max(2000).optional(),
  desiredResults: z.string().max(2000).optional(),
  lineManagerProfile: z.string().max(2000).optional(),
  complete: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
      serverInstance.warning('Unauthorized preparation access', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        preparationIntent: participation.preparationIntent,
        desiredResults: participation.desiredResults,
        lineManagerProfile: participation.lineManagerProfile,
        preparationCompletedAt: participation.preparationCompletedAt,
        status: participation.status,
      },
    });
  } catch (error) {
    serverInstance.error(
      'Error in GET /api/my-courses/[bookingId]/preparation',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
    const parseResult = preparationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { complete, ...preparationData } = parseResult.data;

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized preparation update', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    // Update preparation data
    await updatePreparation(participation.id, preparationData, complete);

    // If completing, advance to next step
    if (complete) {
      await completePreparationStep(participation.id);
      serverInstance.info('Preparation step completed', {
        userId,
        bookingId,
        participationId: participation.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: complete ? 'Preparation completed' : 'Data saved',
    });
  } catch (error) {
    serverInstance.error(
      'Error in PUT /api/my-courses/[bookingId]/preparation',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
