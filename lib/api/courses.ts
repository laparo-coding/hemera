/**
 * Course API utilities for data fetching
 * Provides server-side functions for course management
 */

import { PaymentStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  CourseNotFoundError,
  CourseNotPublishedError,
  DatabaseConnectionError,
  logError,
} from '../errors';
import type { CurriculumModule } from '../schemas/admin/course';

export const featuredCoursesTimeoutMs = 3_000;

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function logCourseApiError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  try {
    logError(error, context);
  } catch {
    // Ignore request-context logging failures so data fallbacks remain usable.
  }
}

export interface CourseLocation {
  id: string;
  name: string;
  slug: string;
  city: string;
}

const courseLocationSelect = {
  id: true,
  name: true,
  slug: true,
  city: true,
} as const;

export interface Course {
  id: string;
  title: string;
  description: string | null;
  teaser: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity?: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  availableSpots?: number | null;
  totalBookings?: number;
  userBookingStatus?: string | null;
  level?: string | null;
  location?: CourseLocation | null;
  thumbnailUrl?: string | null;
  instructor?: string | null;
  imageTwitter?: string | null;
  heroVideoPlaybackId?: string | null;
  curriculum?: CurriculumModule[] | null;
}

export interface CourseWithSEO extends Course {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  instructor?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

/**
 * Get all published courses
 * Used for the public course listing page
 * Includes location data for display
 */
export async function getPublishedCourses(): Promise<Course[]> {
  try {
    // Try new schema first, fallback to old if columns don't exist
    let allCourses;
    try {
      allCourses = await prisma.course.findMany({
        orderBy: {
          startDate: 'asc',
        },
        include: {
          location: {
            select: courseLocationSelect,
          },
        },
      });
    } catch (_schemaError) {
      // Fallback to createdAt ordering if startDate doesn't exist yet
      allCourses = await prisma.course.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          location: {
            select: courseLocationSelect,
          },
        },
      });
    }

    // Filter published courses (exclude non-public courses for Learning Path feature)
    const courses = allCourses.filter(
      course => course.isPublished && !course.isNonPublic
    );

    // Compute availability (FR-011): derive from internal capacities/bookings
    const courseIds = courses.map(c => c.id);
    let countsMap = new Map<string, number>();
    if (courseIds.length > 0) {
      const relatedBookings = await prisma.booking.findMany({
        where: {
          courseId: { in: courseIds },
          paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PENDING] },
        },
        select: { courseId: true },
      });

      countsMap = relatedBookings.reduce((acc, b) => {
        acc.set(b.courseId, (acc.get(b.courseId) || 0) + 1);
        return acc;
      }, new Map<string, number>());
    }

    const enriched = courses.map(course => {
      const totalBookings = countsMap.get(course.id) || 0;
      const availableSpots =
        course.capacity !== null && course.capacity !== undefined
          ? Math.max(0, Number(course.capacity) - totalBookings)
          : null;
      return {
        ...course,
        currency: course.currency || 'EUR',
        availableSpots,
        totalBookings,
        userBookingStatus: null,
        // Ensure new fields exist with fallback
        startDate: course.startDate ?? null,
        startTime: course.startTime ?? null,
        endTime: course.endTime ?? null,
      } as Course;
    });

    return enriched;
  } catch (error) {
    logCourseApiError(error, { operation: 'getPublishedCourses' });
    throw error;
  }
}

/**
 * Get featured courses for homepage display
 * Returns a limited number of courses for featured section
 * Includes location data for display
 */
export async function getFeaturedCourses(limit = 3): Promise<Course[]> {
  try {
    const courses = await withTimeout(
      prisma.course.findMany({
        where: {
          isPublished: true,
          isNonPublic: false, // Exclude Learning Path invite-only courses
        },
        include: {
          location: {
            select: courseLocationSelect,
          },
        },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        take: limit,
      }),
      featuredCoursesTimeoutMs,
      'Featured courses query timed out'
    );

    // Map to consistent Course interface with location
    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      teaser: course.teaser,
      slug: course.slug,
      price: course.price,
      currency: course.currency || 'EUR',
      capacity: course.capacity ?? null,
      startDate: course.startDate ?? null,
      startTime: course.startTime ?? null,
      endTime: course.endTime ?? null,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      availableSpots: null,
      totalBookings: 0,
      userBookingStatus: null,
      level: course.level ?? null,
      thumbnailUrl: course.thumbnailUrl ?? null,
      location: course.location
        ? {
            id: course.location.id,
            name: course.location.name,
            slug: course.location.slug,
            city: course.location.city,
          }
        : null,
    }));
  } catch (error) {
    logCourseApiError(error, { operation: 'getFeaturedCourses', limit });
    // Return an empty DB-driven result instead of throwing so the caller can
    // render an explicit empty state without inventing placeholder seminars.
    return [];
  }
}

/**
 * Get a single course by ID
 * Used for course detail pages
 */
export async function getCourseById(id: string): Promise<Course> {
  try {
    const courseRecord = await prisma.course.findUnique({
      where: {
        id,
      },
      include: {
        bookings: {
          where: {
            paymentStatus: {
              in: [PaymentStatus.PAID, PaymentStatus.PENDING],
            },
          },
          select: {
            id: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
    });

    if (!courseRecord?.isPublished || courseRecord?.isNonPublic) {
      throw new CourseNotFoundError(id);
    }

    const { bookings, ...course } = courseRecord as typeof courseRecord & {
      bookings: Array<{ id: string }>;
    };

    const totalBookings = bookings.length;
    const availableSpots =
      course.capacity !== null && course.capacity !== undefined
        ? Math.max(0, Number(course.capacity) - totalBookings)
        : null;

    // Parse curriculum from JSON if present
    const curriculum = course.curriculum as CurriculumModule[] | null;

    return {
      ...course,
      currency: course.currency || 'EUR',
      availableSpots,
      totalBookings,
      userBookingStatus: null,
      curriculum,
    } as Course;
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      throw error; // Re-throw our custom error
    }

    logCourseApiError(error, { operation: 'getCourseById', courseId: id });
    throw new DatabaseConnectionError('fetching course by ID', error as Error);
  }
}

/**
 * Get a single course by slug
 * Used for SEO-friendly course URLs
 */
export async function getCourseBySlug(slug: string): Promise<Course> {
  try {
    const courseRecord = await prisma.course.findUnique({
      where: {
        slug,
      },
      include: {
        bookings: {
          where: {
            paymentStatus: {
              in: [PaymentStatus.PAID, PaymentStatus.PENDING],
            },
          },
          select: {
            id: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
      },
    });

    if (!courseRecord) {
      throw new CourseNotFoundError(`slug:${slug}`);
    }

    if (!courseRecord.isPublished || courseRecord.isNonPublic) {
      throw new CourseNotPublishedError(courseRecord.id);
    }

    const { bookings, ...course } = courseRecord as typeof courseRecord & {
      bookings: Array<{ id: string }>;
    };

    const totalBookings = bookings.length;
    const availableSpots =
      course.capacity !== null && course.capacity !== undefined
        ? Math.max(0, Number(course.capacity) - totalBookings)
        : null;

    // Parse curriculum from JSON if present
    const curriculum = course.curriculum as CurriculumModule[] | null;

    return {
      ...course,
      currency: course.currency || 'EUR',
      availableSpots,
      totalBookings,
      userBookingStatus: null,
      curriculum,
    } as Course;
  } catch (error) {
    if (
      error instanceof CourseNotFoundError ||
      error instanceof CourseNotPublishedError
    ) {
      throw error; // Re-throw our custom errors
    }

    logCourseApiError(error, { operation: 'getCourseBySlug', slug });
    throw new DatabaseConnectionError(
      'fetching course by slug',
      error as Error
    );
  }
}

/**
 * Get all courses (including unpublished) for admin purposes
 * Requires admin privileges
 */
export async function getAllCourses(): Promise<Course[]> {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        startDate: 'asc',
      },
    });

    return courses.map(course => ({
      ...course,
      curriculum: course.curriculum as CurriculumModule[] | null,
    })) as Course[];
  } catch (error) {
    logCourseApiError(error, { operation: 'getAllCourses' });
    throw new DatabaseConnectionError('fetching all courses', error as Error);
  }
}

/**
 * Get the next upcoming course
 * Returns the published course with the earliest date in the future
 */
export async function getNextUpcomingCourse(): Promise<Course | null> {
  try {
    const now = new Date();
    const course = await prisma.course.findFirst({
      where: {
        isPublished: true,
        isNonPublic: false, // Exclude Learning Path invite-only courses
        startDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    if (!course) return null;

    return {
      ...course,
      curriculum: course.curriculum as CurriculumModule[] | null,
    } as Course;
  } catch (error) {
    logCourseApiError(error, { operation: 'getNextUpcomingCourse' });
    throw new DatabaseConnectionError(
      'fetching next upcoming course',
      error as Error
    );
  }
}

/**
 * Get course count statistics
 * Returns counts for published/unpublished courses
 */
export async function getCourseStats() {
  try {
    const [total, published, unpublished, nonPublic] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true, isNonPublic: false } }),
      prisma.course.count({ where: { isPublished: false } }),
      prisma.course.count({ where: { isNonPublic: true } }),
    ]);

    return {
      total,
      published,
      unpublished,
      nonPublic,
    };
  } catch (error) {
    logCourseApiError(error, { operation: 'getCourseStats' });
    throw new DatabaseConnectionError(
      'fetching course statistics',
      error as Error
    );
  }
}
