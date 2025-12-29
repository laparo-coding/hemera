/**
 * Summary Step API Route
 *
 * GET - Retrieve summary assets for a booking (course defaults or booking overrides)
 * PUT - Mark summary as viewed/completed
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  completeSummaryStep,
  getParticipationByBookingId,
  getResolvedSummaryAssets,
  recordSummaryPresented,
} from '../../../../../lib/db/courseParticipation';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';

// Zod schema for summary update
const summaryUpdateSchema = z.object({
  markViewed: z.boolean().optional(),
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
      serverInstance.warning('Unauthorized summary access', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    // Get resolved summary assets
    const assets = await getResolvedSummaryAssets(
      participation.id,
      participation.courseId
    );

    return NextResponse.json({
      success: true,
      data: {
        assets,
        summaryPresentedAt: participation.summaryPresentedAt,
        summaryAssetSource: participation.summaryAssetSource,
        summaryCompletedAt: participation.summaryCompletedAt,
        status: participation.status,
        hasAssets: assets.length > 0,
      },
    });
  } catch (error) {
    serverInstance.error('Error in GET /api/my-courses/[bookingId]/summary', {
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
    const parseResult = summaryUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { markViewed, complete } = parseResult.data;

    const participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      return NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (participation.booking.userId !== userId) {
      serverInstance.warning('Unauthorized summary update', {
        userId,
        bookingId,
        ownerId: participation.booking.userId,
      });
      return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    // Mark as viewed if requested
    if (markViewed && !participation.summaryPresentedAt) {
      const assets = await getResolvedSummaryAssets(
        participation.id,
        participation.courseId
      );
      if (assets.length > 0) {
        await recordSummaryPresented(participation.id, assets[0].source);
        serverInstance.info('Summary marked as viewed', {
          userId,
          bookingId,
          participationId: participation.id,
          assetSource: assets[0].source,
        });
      }
    }

    // Complete step if requested
    if (complete) {
      await completeSummaryStep(participation.id);
      serverInstance.info('Summary step completed', {
        userId,
        bookingId,
        participationId: participation.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: complete ? 'Summary completed' : 'Updated',
    });
  } catch (error) {
    serverInstance.error('Error in PUT /api/my-courses/[bookingId]/summary', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
