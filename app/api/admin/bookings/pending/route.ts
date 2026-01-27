import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

// CORS headers for external app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/admin/bookings/pending
 * Returns all bookings with PRE_BOOKED status that require admin review
 * Used for Learning Path feature (021)
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
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
    const isAdmin = await checkUserAdminStatus(userId);
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

    // Fetch pending bookings with PRE_BOOKED status
    const pendingBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'PRE_BOOKED',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            level: true,
            startDate: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isOutperformer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to response format
    const response = pendingBookings.map(booking => ({
      id: booking.id,
      createdAt: booking.createdAt.toISOString(),
      user: {
        id: booking.user.id,
        clerkUserId: booking.user.id, // id IS the clerkUserId
        email: booking.user.email,
        firstName: booking.user.name?.split(' ')[0] || null,
        lastName: booking.user.name?.split(' ').slice(1).join(' ') || null,
        isOutperformer: booking.user.isOutperformer,
      },
      course: {
        id: booking.course.id,
        title: booking.course.title,
        level: booking.course.level,
        startDate: booking.course.startDate?.toISOString() ?? null,
      },
    }));

    const successResponse = createSuccessResponse(response, requestId);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      successResponse.headers.set(key, value);
    });
    return successResponse;
  } catch (error) {
    // Log minimal context without full error object
    serverInstance.error('Failed to fetch pending bookings', {
      context: 'AdminBookingsPending.GET',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Failed to fetch pending bookings',
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
