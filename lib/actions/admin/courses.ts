/**
 * Admin Course Server Actions
 *
 * Next.js Server Actions for course management.
 * These functions are called directly from React components.
 *
 * Features:
 * - Zod validation on all inputs
 * - Rollbar error logging
 * - Clerk admin authorization
 * - Path revalidation after mutations
 */

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import * as courseDb from '../../db/admin/courses';
import { serverInstance as rollbar } from '../../monitoring/rollbar-official';
import {
  courseCreateSchema,
  courseUpdateSchema,
  enrollmentTransferSchema,
} from '../../schemas/admin/course';
import type { AdminOperationResult } from '../../types/admin';

/**
 * Check if current user has admin role
 */
async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('AUTH_MISSING_TOKEN');
  }

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  if (!isAdmin) {
    throw new Error('AUTH_INSUFFICIENT_PERMISSIONS');
  }

  return userId;
}

/**
 * Create a new course
 */
export async function createCourseAction(
  formData: unknown
): Promise<AdminOperationResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin();

    // Validate input
    const validatedData = courseCreateSchema.parse(formData);

    // Ensure required database shape: `createCourse` expects a non-null
    // `startDate` (Date). The Zod schema allows `startDate` optional/null;
    // if missing we default it to the `startTime` date so the DB has a valid
    // start date component.
    const createPayload = {
      ...validatedData,
      startDate: validatedData.startDate ?? validatedData.startTime,
    };

    // Create course
    const course = await courseDb.createCourse(createPayload as any);

    // Log success
    rollbar.info('Course created by admin', {
      adminId,
      courseId: course.id,
      action: 'create',
      timestamp: new Date().toISOString(),
    });

    // Revalidate admin course list
    revalidatePath('/admin/courses');
    revalidatePath('/admin');

    return {
      success: true,
      data: { id: course.id },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.startsWith('AUTH_')) {
      return {
        success: false,
        error:
          errorMessage === 'AUTH_INSUFFICIENT_PERMISSIONS'
            ? 'Admin role required'
            : 'Authentication required',
        code: errorMessage,
      };
    }

    // Log to Rollbar
    rollbar.error('Failed to create course', error as Error, {
      action: 'create',
    });

    return {
      success: false,
      error: 'Failed to create course',
      code: 'COURSE_CREATE_FAILED',
    };
  }
}

/**
 * Update an existing course
 */
export async function updateCourseAction(
  id: string,
  formData: unknown
): Promise<AdminOperationResult<{ id: string }>> {
  try {
    const adminId = await requireAdmin();

    // Validate input
    const validatedData = courseUpdateSchema.parse(formData);

    // Update course
    await courseDb.updateCourse(id, validatedData);

    // Log success
    rollbar.info('Course updated by admin', {
      adminId,
      courseId: id,
      action: 'update',
      timestamp: new Date().toISOString(),
    });

    // Revalidate paths
    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath(`/admin/courses/${id}`);

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.startsWith('AUTH_')) {
      return {
        success: false,
        error:
          errorMessage === 'AUTH_INSUFFICIENT_PERMISSIONS'
            ? 'Admin role required'
            : 'Authentication required',
        code: errorMessage,
      };
    }

    if (errorMessage === 'COURSE_NOT_FOUND') {
      return {
        success: false,
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND',
      };
    }

    if (errorMessage === 'CONCURRENT_EDIT_CONFLICT') {
      rollbar.warning('Concurrent edit conflict detected', {
        courseId: id,
        action: 'update',
      });
      return {
        success: false,
        error:
          'Course was modified by another admin. Please refresh and try again.',
        code: 'CONCURRENT_EDIT_CONFLICT',
      };
    }

    if (errorMessage.startsWith('CAPACITY_BELOW_ENROLLMENTS')) {
      const [, enrollmentCount, requestedCapacity] = errorMessage.split(':');
      rollbar.warning('Capacity below enrollment count', {
        courseId: id,
        enrollmentCount: enrollmentCount
          ? Number.parseInt(enrollmentCount, 10)
          : 0,
        requestedCapacity: requestedCapacity
          ? Number.parseInt(requestedCapacity, 10)
          : 0,
      });
      return {
        success: false,
        error: `Capacity cannot be less than current enrollment count (${enrollmentCount ?? 'unknown'})`,
        code: 'CAPACITY_BELOW_ENROLLMENTS',
      };
    }

    // Log unexpected error
    rollbar.error('Failed to update course', error as Error, {
      action: 'update',
      courseId: id,
    });

    return {
      success: false,
      error: 'Failed to update course',
      code: 'COURSE_UPDATE_FAILED',
    };
  }
}

/**
 * Delete a course (only if no enrollments)
 */
export async function deleteCourseAction(
  id: string
): Promise<AdminOperationResult<void>> {
  try {
    const adminId = await requireAdmin();

    // Delete course
    await courseDb.deleteCourse(id);

    // Log success
    rollbar.info('Course deleted by admin', {
      adminId,
      courseId: id,
      action: 'delete',
      timestamp: new Date().toISOString(),
    });

    // Revalidate paths
    revalidatePath('/admin/courses');
    revalidatePath('/admin');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.startsWith('AUTH_')) {
      return {
        success: false,
        error:
          errorMessage === 'AUTH_INSUFFICIENT_PERMISSIONS'
            ? 'Admin role required'
            : 'Authentication required',
        code: errorMessage,
      };
    }

    if (errorMessage.startsWith('ACTIVE_ENROLLMENTS_EXIST')) {
      const [, count, _enrollmentsJson] = errorMessage.split(':');
      rollbar.warning('Cannot delete course with active enrollments', {
        courseId: id,
        enrollmentCount: count ? Number.parseInt(count, 10) : 0,
      });
      return {
        success: false,
        error: `Cannot delete course with ${count ?? 'some'} active enrollments. Transfer students first.`,
        code: 'ACTIVE_ENROLLMENTS_EXIST',
      };
    }

    // Log unexpected error
    rollbar.error('Failed to delete course', error as Error, {
      action: 'delete',
      courseId: id,
    });

    return {
      success: false,
      error: 'Failed to delete course',
      code: 'COURSE_DELETE_FAILED',
    };
  }
}

/**
 * Transfer enrollments from one course to another
 */
export async function transferEnrollmentsAction(
  sourceCourseId: string,
  formData: unknown
): Promise<AdminOperationResult<{ transferredCount: number }>> {
  try {
    const adminId = await requireAdmin();

    // Validate input
    const { targetCourseId } = enrollmentTransferSchema.parse(formData);

    // Prevent self-transfer
    if (sourceCourseId === targetCourseId) {
      return {
        success: false,
        error: 'Cannot transfer to the same course',
        code: 'INVALID_TRANSFER_TARGET',
      };
    }

    // Transfer enrollments
    const result = await courseDb.transferEnrollments(
      sourceCourseId,
      targetCourseId
    );

    // Log success
    rollbar.info('Enrollments transferred by admin', {
      adminId,
      sourceCourseId,
      targetCourseId,
      transferredCount: result.transferredCount,
      action: 'transfer',
      timestamp: new Date().toISOString(),
    });

    // Revalidate paths
    revalidatePath('/admin/courses');
    revalidatePath('/admin');
    revalidatePath(`/admin/courses/${sourceCourseId}`);
    revalidatePath(`/admin/courses/${targetCourseId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.startsWith('AUTH_')) {
      return {
        success: false,
        error:
          errorMessage === 'AUTH_INSUFFICIENT_PERMISSIONS'
            ? 'Admin role required'
            : 'Authentication required',
        code: errorMessage,
      };
    }

    if (errorMessage === 'TARGET_COURSE_NOT_FOUND') {
      return {
        success: false,
        error: 'Target course not found',
        code: 'TARGET_COURSE_NOT_FOUND',
      };
    }

    if (errorMessage.startsWith('INSUFFICIENT_CAPACITY')) {
      const [, capacity, current, transfer, available] =
        errorMessage.split(':');
      rollbar.warning('Insufficient capacity for enrollment transfer', {
        sourceCourseId,
        targetCapacity: capacity ? Number.parseInt(capacity, 10) : 0,
        currentEnrollments: current ? Number.parseInt(current, 10) : 0,
        transferCount: transfer ? Number.parseInt(transfer, 10) : 0,
        availableSlots: available ? Number.parseInt(available, 10) : 0,
      });
      return {
        success: false,
        error: `Target course has insufficient capacity (${available ?? '?'} slots available, ${transfer ?? '?'} needed)`,
        code: 'INSUFFICIENT_CAPACITY',
      };
    }

    // Log unexpected error
    rollbar.error('Failed to transfer enrollments', error as Error, {
      action: 'transfer',
      sourceCourseId,
    });

    return {
      success: false,
      error: 'Failed to transfer enrollments',
      code: 'TRANSFER_FAILED',
    };
  }
}
