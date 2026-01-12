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
  slug: string;
  price: number | null;
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
  heroVideoPlaybackId?: string | null;
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

    // Filter published courses
    const courses = allCourses.filter(course => course.isPublished);

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

    if (process.env.NODE_ENV !== 'production') {
      try {
        const samplePreview = enriched.slice(0, 3).map(course => ({
          id: course.id,
          slug: course.slug,
          published: course.isPublished,
        }));
        console.info('[getPublishedCourses]', {
          count: enriched.length,
          sample: samplePreview,
        });
      } catch (logError) {
        console.warn(
          '[getPublishedCourses] failed to log debug info',
          logError
        );
      }
    }

    return enriched;
  } catch (error) {
    logError(error, { operation: 'getPublishedCourses' });
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
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        location: {
          select: courseLocationSelect,
        },
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    // Map to consistent Course interface with location
    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
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
    logError(error, { operation: 'getFeaturedCourses', limit });
    // Return empty array instead of throwing to prevent page crash
    // The page will use static fallback data
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

    if (!courseRecord || !courseRecord.isPublished) {
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

    return {
      ...course,
      currency: course.currency || 'EUR',
      availableSpots,
      totalBookings,
      userBookingStatus: null,
    } as Course;
  } catch (error) {
    if (error instanceof CourseNotFoundError) {
      throw error; // Re-throw our custom error
    }

    logError(error, { operation: 'getCourseById', courseId: id });
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

    if (!courseRecord.isPublished) {
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

    return {
      ...course,
      currency: course.currency || 'EUR',
      availableSpots,
      totalBookings,
      userBookingStatus: null,
    } as Course;
  } catch (error) {
    if (
      error instanceof CourseNotFoundError ||
      error instanceof CourseNotPublishedError
    ) {
      throw error; // Re-throw our custom errors
    }

    logError(error, { operation: 'getCourseBySlug', slug });
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

    return courses;
  } catch (error) {
    logError(error, { operation: 'getAllCourses' });
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
        startDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return course;
  } catch (error) {
    logError(error, { operation: 'getNextUpcomingCourse' });
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
    const [total, published, unpublished] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.count({ where: { isPublished: false } }),
    ]);

    return {
      total,
      published,
      unpublished,
    };
  } catch (error) {
    logError(error, { operation: 'getCourseStats' });
    throw new DatabaseConnectionError(
      'fetching course statistics',
      error as Error
    );
  }
}
