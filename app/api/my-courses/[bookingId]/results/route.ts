/**
 * Results Step API Route
 *
 * GET - Retrieve results data for a booking
 * PUT - Update results data (save/complete - final step)
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  completeResultsStep,
  getParticipationByBookingId,
  updateResults,
} from '../../../../../lib/db/courseParticipation';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';

// Zod schema for results input
const resultsSchema = z.object({
  resultsOutcome: z.string().max(2000).optional(),
  resultsNotes: z.string().max(2000).optional(),
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
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID ist erforderlich' },
        { status: 400 }
      );
    }

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Teilnahme nicht gefunden' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized results access', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        resultsOutcome: participation.resultsOutcome,
        resultsNotes: participation.resultsNotes,
        resultsCompletedAt: participation.resultsCompletedAt,
        status: participation.status,
        isComplete: participation.status === 'COMPLETE',
      },
    });
  } catch (error) {
    serverInstance.error('Error in GET /api/my-courses/[bookingId]/results', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parseResult = resultsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { complete, ...resultsData } = parseResult.data;

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Teilnahme nicht gefunden' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized results update', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    // Update results data
    await updateResults(participation.id, resultsData);

    // If completing, mark entire participation as complete
    if (complete) {
      await completeResultsStep(participation.id);
      serverInstance.info('Participation completed', {
        userId,
        bookingId,
        participationId: participation.id,
        courseTitle: participation.booking.course.title,
      });
    }

    return NextResponse.json({
      success: true,
      message: complete ? 'Teilnahme abgeschlossen' : 'Daten gespeichert',
    });
  } catch (error) {
    serverInstance.error('Error in PUT /api/my-courses/[bookingId]/results', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
