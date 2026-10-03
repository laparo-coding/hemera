import { randomUUID } from 'node:crypto';
import { after, type NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '../../../../../../lib/auth/helpers';
import { prisma } from '../../../../../../lib/db/prisma';
import { serverInstance } from '../../../../../../lib/monitoring/rollbar-official';
import { bookingReviewSchema } from '../../../../../../lib/schemas/admin/booking';
import { sendBookingRejectedEmail } from '../../../../../../lib/services/loops';
import { dispatchSeminarRecordingDeletions } from '../../../../../../lib/services/seminar-recording-deletion-outbox';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../../lib/utils/api-response';
import {
  applyCorsHeaders,
  getCorsHeaders,
} from '../../../../../../lib/utils/cors';
import { getOrCreateRequestId } from '../../../../../../lib/utils/request-id';

// CORS headers for external app access
const corsHeaders = getCorsHeaders();

class BookingReviewConflict extends Error {}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/bookings/[id]/review
 * Approve or reject a PRE_BOOKED booking
 * Used for Learning Path feature (021)
 *
 * WORKFLOW:
 * 1. User creates PRE_BOOKED booking (doesn't meet prerequisites)
 * 2. Admin receives notification email
 * 3. Admin reviews via BookingReviewDialog
 * 4. This endpoint approves (→ PENDING) or rejects (→ CANCELLED + email)
 *
 * TODO: Create admin dashboard at app/admin/bookings/pending/page.tsx
 * TODO: Add customer notification UI for PRE_BOOKED status
 * TODO: Implement review time SLA alerts (>48h)
 *
 * @see docs/features/021-learning-path/PRE_BOOKED_APPROVAL_WORKFLOW.md
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = getOrCreateRequestId(request);
  let bookingId: string | undefined;

  try {
    // Resolve params
    const params = await context.params;
    bookingId = params.id;

    // Validate booking ID
    if (!bookingId || bookingId.trim() === '') {
      return applyCorsHeaders(
        createErrorResponse(
          'Invalid booking ID',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400
        ),
        corsHeaders
      );
    }

    // Admin authentication + authorization
    const adminAuth = await requireAdminUser(requestId);
    if (!adminAuth.authorized) {
      return applyCorsHeaders(adminAuth.response, corsHeaders);
    }
    const userId = adminAuth.userId;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (_parseError) {
      return applyCorsHeaders(
        createErrorResponse(
          'Invalid JSON body',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400
        ),
        corsHeaders
      );
    }

    const parseResult = bookingReviewSchema.safeParse(body);
    if (!parseResult.success) {
      const validationMessages = parseResult.error.issues
        .map(e => e.message)
        .join(', ');
      return applyCorsHeaders(
        createErrorResponse(
          `Validation error: ${validationMessages}`,
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400
        ),
        corsHeaders
      );
    }

    const { action } = parseResult.data;

    // Fetch the booking with user and course details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!booking) {
      return applyCorsHeaders(
        createErrorResponse(
          'Booking not found',
          ErrorCodes.NOT_FOUND,
          requestId,
          404
        ),
        corsHeaders
      );
    }

    // Ensure booking is in PRE_BOOKED status
    if (booking.paymentStatus !== 'PRE_BOOKED') {
      return applyCorsHeaders(
        createErrorResponse(
          'Booking is not in pending review status',
          ErrorCodes.CONFLICT,
          requestId,
          409
        ),
        corsHeaders
      );
    }

    if (action === 'approve') {
      // Approve: Change status to PENDING (allows payment)
      // Use atomic update with status precondition to prevent race conditions
      const updatedBooking = await prisma.booking.updateMany({
        where: {
          id: bookingId,
          paymentStatus: 'PRE_BOOKED', // Atomic precondition: only update if still PRE_BOOKED
        },
        data: {
          paymentStatus: 'PENDING',
          reviewedAt: new Date(),
          reviewedBy: userId,
        },
      });

      // Check if the update succeeded (count > 0)
      if (updatedBooking.count === 0) {
        return applyCorsHeaders(
          createErrorResponse(
            'Booking status changed during review (possible race condition)',
            ErrorCodes.CONFLICT,
            requestId,
            409
          ),
          corsHeaders
        );
      }

      // Fetch updated booking for response
      const updatedBookingData = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      return applyCorsHeaders(
        createSuccessResponse(
          {
            id: updatedBookingData?.id,
            paymentStatus: updatedBookingData?.paymentStatus,
            reviewedAt: updatedBookingData?.reviewedAt?.toISOString(),
            reviewedBy: updatedBookingData?.reviewedBy,
            message: 'Booking approved successfully',
          },
          requestId
        ),
        corsHeaders
      );
    } else {
      // Reject: Send rejection email and delete booking
      // Use atomic delete with status precondition to prevent race conditions

      // Attempt to send rejection email (non-blocking, has internal guards)
      const customerEmail = booking.user.email;
      if (customerEmail) {
        try {
          await sendBookingRejectedEmail({
            customerEmail,
            customerName: booking.user.name?.split(' ')[0] || 'Teilnehmer',
            courseName: booking.course.title,
          });
        } catch (emailError) {
          // Non-blocking: Log minimal context, no full error object
          serverInstance.warn('Failed to send rejection email', {
            context: 'AdminBookingReview.reject',
            bookingId,
            error:
              emailError instanceof Error
                ? emailError.message
                : 'Unknown error',
          });
          // Continue with rejection even if email fails
        }
      }

      // Revoke access and retain tombstones atomically with the booking deletion.
      // A durable outbox entry per workflow guarantees the provider cleanup is
      // dispatched to Aither even if the request or Aither fails midway.
      const deleteResult = await prisma.$transaction(async tx => {
        // Narrowed copy for the closure below (bookingId is a let above).
        const targetBookingId = bookingId as string;
        const workflows = await tx.seminarRecordingWorkflow.findMany({
          where: { bookingId: targetBookingId, status: { not: 'DELETED' } },
          select: { recordingId: true },
        });

        await tx.seminarRecordingWorkflow.updateMany({
          where: { bookingId: targetBookingId, status: { not: 'DELETED' } },
          data: {
            status: 'DELETION_PENDING',
            deletionRequestedAt: new Date(),
            deletionReason: 'BOOKING_DELETED',
          },
        });

        // One outbox row per recording (unique on bookingId+recordingId);
        // a retry of this rejection reuses the same deletionId.
        for (const workflow of workflows) {
          await tx.seminarRecordingDeletionOutbox.upsert({
            where: {
              bookingId_recordingId: {
                bookingId: targetBookingId,
                recordingId: workflow.recordingId,
              },
            },
            create: {
              bookingId: targetBookingId,
              recordingId: workflow.recordingId,
              deletionId: randomUUID(),
              deletionReason: 'BOOKING_DELETED',
            },
            update: {},
          });
        }

        const result = await tx.booking.deleteMany({
          where: {
            id: targetBookingId,
            paymentStatus: 'PRE_BOOKED', // Only delete if still PRE_BOOKED
          },
        });
        if (result.count === 0) {
          throw new BookingReviewConflict();
        }
        return result;
      });

      // Dispatch the provider cleanup after the response; failures stay in
      // the outbox and are retried on the next trigger.
      after(async () => {
        try {
          await dispatchSeminarRecordingDeletions();
        } catch (error) {
          serverInstance.error(
            'Seminar recording deletion dispatch failed',
            error instanceof Error ? error : new Error('unknown'),
            { bookingId }
          );
        }
      });

      // Check if deletion succeeded
      if (deleteResult.count === 0) {
        return applyCorsHeaders(
          createErrorResponse(
            'Booking status changed during review (possible race condition)',
            ErrorCodes.CONFLICT,
            requestId,
            409
          ),
          corsHeaders
        );
      }

      return applyCorsHeaders(
        createSuccessResponse(
          {
            id: bookingId,
            message: 'Booking rejected and removed',
          },
          requestId
        ),
        corsHeaders
      );
    }
  } catch (error) {
    if (error instanceof BookingReviewConflict) {
      return applyCorsHeaders(
        createErrorResponse(
          'Booking status changed during review (possible race condition)',
          ErrorCodes.CONFLICT,
          requestId,
          409
        ),
        corsHeaders
      );
    }
    // Log minimal context without full error object
    serverInstance.error('Failed to process booking review', {
      context: 'AdminBookingReview.PATCH',
      bookingId: bookingId || 'unknown',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return applyCorsHeaders(
      createErrorResponse(
        'Failed to process booking review',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      ),
      corsHeaders
    );
  }
}
