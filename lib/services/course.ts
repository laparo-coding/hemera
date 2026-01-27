import { type CourseLevel, PaymentStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

export { PaymentStatus } from '@prisma/client';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  teaser: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  level: CourseLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  courseId: string;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithBookings extends Course {
  bookings: Booking[];
}

export interface CourseSearchParams {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
}

/**
 * Get all courses with optional filtering
 */
export async function getCourses(
  params?: CourseSearchParams
): Promise<CourseWithBookings[]> {
  const where: Record<string, unknown> = {
    isNonPublic: false, // Exclude Learning Path invite-only courses by default
  };

  if (params?.title) {
    where.title = {
      contains: params.title,
      mode: 'insensitive',
    };
  }

  if (params?.minPrice !== undefined) {
    where.price = {
      ...(where.price as Record<string, unknown>),
      gte: params.minPrice,
    };
  }

  if (params?.maxPrice !== undefined) {
    where.price = {
      ...(where.price as Record<string, unknown>),
      lte: params.maxPrice,
    };
  }

  const courses = (await prisma.course.findMany({
    where,
    include: {
      bookings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })) as unknown as CourseWithBookings[];

  // Filter out courses that are full if availableOnly is true
  if (params?.availableOnly) {
    return courses.filter(course => isCourseAvailable(course));
  }

  return courses;
}

/**
 * Get course by ID
 * By default, excludes non-public courses (Learning Path invite-only).
 */
export async function getCourseById(
  id: string,
  options?: { includeNonPublic?: boolean }
): Promise<CourseWithBookings | null> {
  const where: Record<string, unknown> = { id };

  // Exclude non-public courses by default (can be overridden by admin endpoints)
  if (!options?.includeNonPublic) {
    where.isNonPublic = false;
  }

  return (await prisma.course.findUnique({
    where: where as { id: string },
    include: {
      bookings: true,
    },
  })) as unknown as CourseWithBookings | null;
}

/**
 * Get course by ID or slug
 * Convenience helper to resolve a course reference that may be a UUID (id) or a human-friendly slug.
 * By default, excludes non-public courses (Learning Path invite-only).
 */
export async function getCourseByIdOrSlug(
  idOrSlug: string,
  options?: { includeNonPublic?: boolean }
): Promise<CourseWithBookings | null> {
  const where: Record<string, unknown> = {
    OR: [{ id: idOrSlug }, { slug: idOrSlug }],
  };

  // Exclude non-public courses by default (can be overridden by admin endpoints)
  if (!options?.includeNonPublic) {
    where.isNonPublic = false;
  }

  return (await prisma.course.findFirst({
    where,
    include: {
      bookings: true,
    },
  })) as unknown as CourseWithBookings | null;
}

/**
 * Check if a course has available spots
 */
export function isCourseAvailable(course: CourseWithBookings): boolean {
  if (course.capacity && course.capacity > 0) {
    const paidBookings = course.bookings.filter(
      booking => booking.paymentStatus === PaymentStatus.PAID
    );
    return paidBookings.length < course.capacity;
  }
  // If no capacity limit is set, course is always available
  return true;
}

/**
 * Get available spots for a course
 */
export function getAvailableSpots(course: CourseWithBookings): number | null {
  if (!course.capacity) {
    return null; // No limit
  }

  const paidBookings = course.bookings.filter(
    booking => booking.paymentStatus === PaymentStatus.PAID
  );

  return Math.max(0, course.capacity - paidBookings.length);
}

/**
 * Check if a user has already booked a course
 */
export async function hasUserBookedCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  return booking !== null;
}

/**
 * Get user's booking for a specific course
 */
export async function getUserBooking(
  userId: string,
  courseId: string
): Promise<Booking | null> {
  return (await prisma.booking.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  })) as unknown as Booking | null;
}

/**
 * Search courses by title/description
 */
export async function searchCourses(
  query: string
): Promise<CourseWithBookings[]> {
  return (await prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false, // Exclude Learning Path invite-only courses
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      bookings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })) as unknown as CourseWithBookings[];
}

/**
 * Get courses with available spots only
 */
export async function getAvailableCourses(): Promise<CourseWithBookings[]> {
  return getCourses({ availableOnly: true });
}
