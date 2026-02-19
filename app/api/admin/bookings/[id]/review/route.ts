import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../../../lib/auth/helpers';
import { prisma } from '../../../../../../lib/db/prisma';
import { serverInstance } from '../../../../../../lib/monitoring/rollbar-official';
import { bookingReviewSchema } from '../../../../../../lib/schemas/admin/booking';
import { sendBookingRejectedEmail } from '../../../../../../lib/services/loops';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../../../lib/utils/request-id';

// CORS headers for external app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
      const errorResponse = createErrorResponse(
        'Invalid booking ID',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus();
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (_parseError) {
      const errorResponse = createErrorResponse(
        'Invalid JSON body',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const parseResult = bookingReviewSchema.safeParse(body);
    if (!parseResult.success) {
      const errorResponse = createErrorResponse(
        `Validation error: ${parseResult.error.issues.map(e => e.message).join(', ')}`,
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
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
      const errorResponse = createErrorResponse(
        'Booking not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Ensure booking is in PRE_BOOKED status
    if (booking.paymentStatus !== 'PRE_BOOKED') {
      const errorResponse = createErrorResponse(
        'Booking is not in pending review status',
        ErrorCodes.CONFLICT,
        requestId,
        409
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
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
        const errorResponse = createErrorResponse(
          'Booking status changed during review (possible race condition)',
          ErrorCodes.CONFLICT,
          requestId,
          409
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        return errorResponse;
      }

      // Fetch updated booking for response
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      const successResponse = createSuccessResponse(
        {
          id: booking!.id,
          paymentStatus: booking!.paymentStatus,
          reviewedAt: booking!.reviewedAt?.toISOString(),
          reviewedBy: booking!.reviewedBy,
          message: 'Booking approved successfully',
        },
        requestId
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        successResponse.headers.set(key, value);
      });
      return successResponse;
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

      // Atomic delete with status precondition
      const deleteResult = await prisma.booking.deleteMany({
        where: {
          id: bookingId,
          paymentStatus: 'PRE_BOOKED', // Only delete if still PRE_BOOKED
        },
      });

      // Check if deletion succeeded
      if (deleteResult.count === 0) {
        const errorResponse = createErrorResponse(
          'Booking status changed during review (possible race condition)',
          ErrorCodes.CONFLICT,
          requestId,
          409
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        return errorResponse;
      }

      const successResponse = createSuccessResponse(
        {
          id: bookingId,
          message: 'Booking rejected and removed',
        },
        requestId
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        successResponse.headers.set(key, value);
      });
      return successResponse;
    }
  } catch (error) {
    // Log minimal context without full error object
    serverInstance.error('Failed to process booking review', {
      context: 'AdminBookingReview.PATCH',
      bookingId: bookingId || 'unknown',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Failed to process booking review',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}
