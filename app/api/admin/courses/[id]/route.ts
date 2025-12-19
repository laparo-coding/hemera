/**
 * Admin Course API Routes - Single Course Operations
 * GET /api/admin/courses/[id] - Get course by ID
 * PATCH /api/admin/courses/[id] - Update course
 * DELETE /api/admin/courses/[id] - Delete course
 */

import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../../lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

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
 * GET /api/admin/courses/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!course) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    return createSuccessResponse(
      {
        ...course,
        enrollmentCount: course._count.bookings,
      },
      requestId
    );
  } catch (error) {
    rollbar.error('Failed to fetch course by ID', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'GET',
    });

    return createErrorResponse(
      'Failed to fetch course',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Update course with optimistic locking
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    const body = await request.json();

    // Check for optimistic locking
    if (!body.updatedAt) {
      return createErrorResponse(
        'updatedAt field required for optimistic locking',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    // Verify course exists and check updatedAt
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { updatedAt: true, _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    // Check for concurrent edit
    const providedUpdatedAt = new Date(body.updatedAt);
    if (existing.updatedAt.getTime() !== providedUpdatedAt.getTime()) {
      rollbar.warning('Concurrent edit conflict detected', {
        requestId,
        courseId: id,
        providedUpdatedAt: providedUpdatedAt.toISOString(),
        actualUpdatedAt: existing.updatedAt.toISOString(),
        route: '/api/admin/courses/[id]',
      });

      return NextResponse.json(
        {
          error: 'Conflict',
          message:
            'Course was modified by another admin. Please refresh and try again.',
          code: 'CONCURRENT_EDIT_CONFLICT',
          latestUpdatedAt: existing.updatedAt.toISOString(),
          requestId,
        },
        { status: 409 }
      );
    }

    // Check capacity constraint
    if (
      body.capacity !== undefined &&
      body.capacity < existing._count.bookings
    ) {
      rollbar.warning('Capacity below enrollment count', {
        requestId,
        courseId: id,
        requestedCapacity: body.capacity,
        currentEnrollments: existing._count.bookings,
        route: '/api/admin/courses/[id]',
      });

      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Capacity cannot be less than current enrollment count',
          code: 'CAPACITY_BELOW_ENROLLMENTS',
          currentEnrollmentCount: existing._count.bookings,
          requestedCapacity: body.capacity,
          requestId,
        },
        { status: 400 }
      );
    }

    // Update course
    const { updatedAt: _, ...updateData } = body;
    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    rollbar.info('Course updated via API', {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'PATCH',
    });

    return createSuccessResponse(
      {
        ...updated,
        enrollmentCount: updated._count.bookings,
      },
      requestId
    );
  } catch (error) {
    rollbar.error('Failed to update course', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'PATCH',
    });

    return createErrorResponse(
      'Failed to update course',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Delete course (only if no enrollments)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    // Check for enrollments
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    if (course._count.bookings > 0) {
      rollbar.warning('Cannot delete course with active enrollments', {
        requestId,
        courseId: id,
        courseTitle: course.title,
        enrollmentCount: course._count.bookings,
        route: '/api/admin/courses/[id]',
      });

      return NextResponse.json(
        {
          error: 'Conflict',
          message:
            'Cannot delete course with active enrollments. Transfer students first.',
          code: 'ACTIVE_ENROLLMENTS_EXIST',
          enrollmentCount: course._count.bookings,
          enrolledStudents: course.bookings.map(b => ({
            userId: b.user.id,
            name: b.user.name,
            enrolledAt: b.createdAt,
          })),
          requestId,
        },
        { status: 409 }
      );
    }

    // Delete course
    await prisma.course.delete({
      where: { id },
    });

    rollbar.info('Course deleted via API', {
      requestId,
      courseId: id,
      courseTitle: course.title,
      route: '/api/admin/courses/[id]',
      method: 'DELETE',
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    rollbar.error('Failed to delete course', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'DELETE',
    });

    return createErrorResponse(
      'Failed to delete course',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
