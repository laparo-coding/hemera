// Course service for API routes
// Provides database access for course management

import type { Booking } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface CourseWithBookings {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  currency: string;
  capacity: number | null;
  startDate?: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string | null;
  instructor?: string | null;
  bookings: Booking[];
}

/**
 * Get all published courses from the database
 * Used by the public API route /api/courses
 */
export async function getCourses(): Promise<CourseWithBookings[]> {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false, // Exclude Learning Path invite-only courses
    },
    orderBy: {
      startDate: 'asc',
    },
    include: {
      bookings: true,
    },
  });

  return courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    slug: course.slug,
    price: course.price ?? 0,
    currency: course.currency || 'EUR',
    capacity: course.capacity,
    startDate: course.startDate,
    startTime: course.startTime,
    endTime: course.endTime,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    thumbnailUrl: course.thumbnailUrl,
    instructor: course.instructor,
    bookings: course.bookings,
  }));
}
