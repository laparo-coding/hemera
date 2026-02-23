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
        'Du bist nicht autorisiert',
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
        'Du bist nicht autorisiert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      ),
      userId: null,
    };
  }

  const isAdmin = await checkUserAdminStatus();
  if (!isAdmin) {
    return {
      error: createErrorResponse(
        'Du brauchst Admin-Rechte',
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
        'Die Ziel-Kurs-ID ist erforderlich',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    // Prevent self-transfer
    if (id === targetCourseId) {
      return createErrorResponse(
        'Die Übertragung in denselben Kurs ist nicht erlaubt',
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
        `Kurs mit der ID ${id} wurde nicht gefunden`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    if (!targetCourse) {
      return createErrorResponse(
        `Ziel-Kurs mit der ID ${targetCourseId} wurde nicht gefunden`,
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
      return createErrorResponse(
        'Der Ziel-Kurs hat nicht genug freie Plätze',
        'INSUFFICIENT_CAPACITY',
        requestId,
        400,
        {
          targetCapacity: targetCourse.capacity,
          targetEnrollmentCount,
          transferCount: sourceEnrollmentCount,
          availableSlots,
        }
      );
    }

    // Perform transfer
    const result = await prisma.booking.updateMany({
      where: { courseId: id },
      data: { courseId: targetCourseId },
    });

    return NextResponse.json(
      {
        message: 'Teilnehmer erfolgreich übertragen',
        transferredCount: result.count,
        sourceCourseId: id,
        targetCourseId,
        requestId,
      },
      { status: 200 }
    );
  } catch (_error) {
    return createErrorResponse(
      'Konnte Übertragung der Teilnehmer nicht durchführen',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
