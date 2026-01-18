/**
 * Debriefing Step API Route
 *
 * GET - Retrieve debriefing data for a booking
 * PUT - Update debriefing data (save/complete)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserWithSync } from '@/lib/api/users';
import {
  completeDebriefingStep,
  getParticipationByBookingId,
  updateDebriefing,
} from '@/lib/db/courseParticipation';
import { serverInstance } from '@/lib/monitoring/rollbar-official';

// Zod schema for debriefing input
const debriefingSchema = z.object({
  debriefingPlan: z.string().max(2000).optional(),
  salaryDiscussionMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM')
    .optional(),
  complete: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const syncedUser = await getCurrentUserWithSync();
    const userId = syncedUser.id;

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
      serverInstance.warning('Unauthorized debriefing access', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        debriefingPlan: participation.debriefingPlan,
        salaryDiscussionMonth: participation.salaryDiscussionMonth,
        status: participation.status,
      },
    });
  } catch (error) {
    serverInstance.error(
      'Error in GET /api/my-courses/[bookingId]/debriefing',
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
    const syncedUser = await getCurrentUserWithSync();
    const userId = syncedUser.id;

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parseResult = debriefingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { complete, ...debriefingData } = parseResult.data;

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized debriefing update', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    // Update debriefing data
    await updateDebriefing(participation.id, debriefingData);

    // If completing, advance to next step
    if (complete) {
      await completeDebriefingStep(participation.id);
      serverInstance.info('Debriefing step completed', {
        userId,
        bookingId,
        participationId: participation.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: complete ? 'Debriefing completed' : 'Data saved',
    });
  } catch (error) {
    serverInstance.error(
      'Error in PUT /api/my-courses/[bookingId]/debriefing',
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
