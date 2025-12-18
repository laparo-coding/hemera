/**
 * Admin Course API Routes - Transfer Enrollments
 * POST /api/admin/courses/[id]/transfer-enrollments
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../../../lib/auth/helpers';
import { prisma } from '../../../../../../lib/db/prisma';
import {
  createErrorResponse,
  ErrorCodes,
} from '../../../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../../../lib/utils/request-id';

/**
 * Check admin authentication
 */
async function checkAdminAuth(requestId: string) {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (_authError) {
    return {
      error: createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      ),
      userId: null,
    };
  }

  if (!userId) {
    return {
      error: createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      ),
      userId: null,
    };
  }

  const isAdmin = await checkUserAdminStatus(userId);
  if (!isAdmin) {
    return {
      error: createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      ),
      userId: null,
    };
  }

  return { error: null, userId };
}

/**
 * POST /api/admin/courses/[id]/transfer-enrollments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    const body = await request.json();
    const { targetCourseId } = body;

    if (!targetCourseId) {
      return createErrorResponse(
        'targetCourseId is required',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    // Prevent self-transfer
    if (id === targetCourseId) {
      return createErrorResponse(
        'Cannot transfer to the same course',
        'INVALID_TRANSFER_TARGET',
        requestId,
        400
      );
    }

    // Validate both courses exist
    const [sourceCourse, targetCourse] = await Promise.all([
      prisma.course.findUnique({
        where: { id },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.course.findUnique({
        where: { id: targetCourseId },
        include: { _count: { select: { bookings: true } } },
      }),
    ]);

    if (!sourceCourse) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    if (!targetCourse) {
      return createErrorResponse(
        `Target course with ID ${targetCourseId} does not exist`,
        'TARGET_COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    // Check capacity
    const sourceEnrollmentCount = sourceCourse._count.bookings;
    const targetEnrollmentCount = targetCourse._count.bookings;
    const availableSlots = targetCourse.capacity - targetEnrollmentCount;

    if (availableSlots < sourceEnrollmentCount) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Target course has insufficient capacity',
          code: 'INSUFFICIENT_CAPACITY',
          targetCapacity: targetCourse.capacity,
          targetEnrollmentCount,
          transferCount: sourceEnrollmentCount,
          availableSlots,
          requestId,
        },
        { status: 400 }
      );
    }

    // Perform transfer
    const result = await prisma.booking.updateMany({
      where: { courseId: id },
      data: { courseId: targetCourseId },
    });

    return NextResponse.json(
      {
        message: 'Successfully transferred enrollments',
        transferredCount: result.count,
        sourceCourseId: id,
        targetCourseId,
        requestId,
      },
      { status: 200 }
    );
  } catch (_error) {
    return createErrorResponse(
      'Failed to transfer enrollments',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
