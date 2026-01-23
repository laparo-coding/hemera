/**
 * Admin Course Database Queries
 *
 * Prisma-based data access layer for admin course management.
 * All functions include enrollment counts and proper error handling.
 */

import type { CourseLevel } from '@prisma/client';
import type { CourseWithEnrollmentCount } from '../../types/admin';
import { prisma } from '../prisma';

/**
 * List all courses sorted by startTime (nearest first)
 * Includes enrollment count for each course
 */
export async function listCourses(filters?: {
  published?: boolean;
}): Promise<CourseWithEnrollmentCount[]> {
  return prisma.course.findMany({
    where:
      filters?.published !== undefined
        ? { isPublished: filters.published }
        : undefined,
    orderBy: {
      startDate: 'asc',
    },
    include: {
      _count: {
        select: {
          bookings: true, // Using bookings as enrollment proxy
        },
      },
    },
  });
}

/**
 * Get a single course by ID with enrollment count
 */
export async function getCourseById(
  id: string
): Promise<CourseWithEnrollmentCount | null> {
  return prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });
}

/**
 * Create a new course
 */
export async function createCourse(data: {
  title: string;
  description: string;
  teaser?: string | null;
  price: number;
  startDate: Date;
  startTime: Date;
  endTime: Date;
  instructor: string;
  level: CourseLevel;
  thumbnailUrl?: string | null;
  capacity: number;
  locationId?: string | null;
  isPublished?: boolean;
}): Promise<CourseWithEnrollmentCount> {
  // Always create courses as unpublished - admin must explicitly publish later
  const { isPublished: _ignored, ...restData } = data;
  const course = await prisma.course.create({
    data: {
      ...restData,
      slug: generateSlug(data.title),
      currency: 'EUR',
      isPublished: false,
    },
    include: {
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });
  return course;
}

/**
 * Update an existing course with optimistic locking
 * Throws error if updatedAt doesn't match (concurrent edit detected)
 */
export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    teaser?: string | null;
    price?: number;
    startTime?: Date;
    duration?: number;
    instructor?: string;
    level?: CourseLevel;
    thumbnailUrl?: string | null;
    capacity?: number;
    locationId?: string | null;
    updatedAt: Date;
  }
): Promise<CourseWithEnrollmentCount> {
  const { updatedAt, ...updateData } = data;

  // Check for concurrent edits (optimistic locking)
  const existing = await prisma.course.findUnique({
    where: { id },
    select: { updatedAt: true },
  });

  if (!existing) {
    throw new Error('COURSE_NOT_FOUND');
  }

  if (existing.updatedAt.getTime() !== updatedAt.getTime()) {
    throw new Error('CONCURRENT_EDIT_CONFLICT');
  }

  // Validate capacity vs enrollments if capacity is being updated
  if (updateData.capacity !== undefined) {
    const enrollmentCount = await prisma.booking.count({
      where: { courseId: id },
    });

    if (updateData.capacity < enrollmentCount) {
      throw new Error(
        `CAPACITY_BELOW_ENROLLMENTS:${enrollmentCount}:${updateData.capacity}`
      );
    }
  }

  return prisma.course.update({
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
}

/**
 * Delete a course (only if no enrollments exist)
 */
export async function deleteCourse(id: string): Promise<void> {
  // Check for active enrollments
  const enrollmentCount = await prisma.booking.count({
    where: { courseId: id },
  });

  if (enrollmentCount > 0) {
    // Fetch enrolled users for error details
    const enrollments = await prisma.booking.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 10, // Limit to first 10 for error message
    });

    throw new Error(
      `ACTIVE_ENROLLMENTS_EXIST:${enrollmentCount}:${JSON.stringify(
        enrollments.map(e => ({
          userId: e.user.id,
          name: e.user.name,
          email: e.user.email,
          enrolledAt: e.createdAt,
        }))
      )}`
    );
  }

  await prisma.course.delete({
    where: { id },
  });
}

/**
 * Transfer all enrollments from one course to another
 */
export async function transferEnrollments(
  sourceCourseId: string,
  targetCourseId: string
): Promise<{ transferredCount: number }> {
  // Validate both courses exist
  const [sourceCourse, targetCourse] = await Promise.all([
    prisma.course.findUnique({
      where: { id: sourceCourseId },
      include: { _count: { select: { bookings: true } } },
    }),
    prisma.course.findUnique({
      where: { id: targetCourseId },
      include: { _count: { select: { bookings: true } } },
    }),
  ]);

  if (!sourceCourse) {
    throw new Error('COURSE_NOT_FOUND');
  }

  if (!targetCourse) {
    throw new Error('TARGET_COURSE_NOT_FOUND');
  }

  // Validate capacity
  const sourceEnrollmentCount = sourceCourse._count.bookings;
  const targetEnrollmentCount = targetCourse._count.bookings;
  const availableSlots = targetCourse.capacity - targetEnrollmentCount;

  if (availableSlots < sourceEnrollmentCount) {
    throw new Error(
      `INSUFFICIENT_CAPACITY:${targetCourse.capacity}:${targetEnrollmentCount}:${sourceEnrollmentCount}:${availableSlots}`
    );
  }

  // Perform transfer
  const result = await prisma.booking.updateMany({
    where: { courseId: sourceCourseId },
    data: { courseId: targetCourseId },
  });

  return { transferredCount: result.count };
}

/**
 * Generate a URL-safe slug from course title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
