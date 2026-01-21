/**
 * Testimonial Service
 * Feature: 017-testimonial-management
 *
 * Service for managing course testimonials/reviews.
 */

import type { Testimonial as PrismaTestimonial } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { Testimonial, TestimonialWithCourse } from '../types/testimonial';

/**
 * Map Prisma Testimonial to service type
 */
function mapToTestimonial(t: PrismaTestimonial): Testimonial {
  return {
    id: t.id,
    courseId: t.courseId,
    userId: t.userId,
    authorName: t.authorName,
    authorRole: t.authorRole,
    authorImage: t.authorImage,
    content: t.content,
    rating: t.rating,
    isPublished: t.isPublished,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/**
 * Get published testimonials for a specific course
 *
 * @param courseId - The course ID to fetch testimonials for
 * @param limit - Maximum number of testimonials to return (default: 10)
 * @returns Array of published testimonials
 */
export async function getPublishedTestimonialsForCourse(
  courseId: string,
  limit = 10
): Promise<Testimonial[]> {
  const testimonials = await prisma.testimonial.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return testimonials.map(mapToTestimonial);
}

/**
 * Get all testimonials for a course (admin view)
 *
 * @param courseId - The course ID
 * @returns Array of all testimonials (published and unpublished)
 */
export async function getAllTestimonialsForCourse(
  courseId: string
): Promise<Testimonial[]> {
  const testimonials = await prisma.testimonial.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
  });

  return testimonials.map(mapToTestimonial);
}

/**
 * Admin filter options
 */
export interface TestimonialFilterOptions {
  status?: boolean; // true = published, false = pending, undefined = all
  courseId?: string;
  limit: number;
  offset: number;
}

/**
 * Get testimonials for admin with filters and pagination
 *
 * @param options - Filter and pagination options
 * @returns Testimonials with course info and total count
 */
export async function getTestimonialsForAdmin(
  options: TestimonialFilterOptions
): Promise<{ testimonials: TestimonialWithCourse[]; total: number }> {
  const where: {
    isPublished?: boolean;
    courseId?: string;
  } = {};

  if (options.status !== undefined) {
    where.isPublished = options.status;
  }
  if (options.courseId) {
    where.courseId = options.courseId;
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return {
    testimonials: testimonials.map(t => ({
      ...mapToTestimonial(t),
      course: t.course,
    })),
    total,
  };
}

/**
 * Create testimonial input
 */
export interface CreateTestimonialData {
  courseId: string;
  userId: string;
  authorName: string;
  authorRole?: string;
  authorImage?: string;
  content: string;
  rating: number;
  isPublished?: boolean;
}

/**
 * Create a new testimonial
 *
 * @param data - Testimonial data
 * @returns Created testimonial
 */
export async function createTestimonial(
  data: CreateTestimonialData
): Promise<Testimonial> {
  // Check if user already submitted a testimonial for this course
  const existing = await prisma.testimonial.findUnique({
    where: {
      courseId_userId: {
        courseId: data.courseId,
        userId: data.userId,
      },
    },
  });

  if (existing) {
    throw new Error(
      'Du hast bereits einen Erfahrungsbericht für diesen Kurs eingereicht'
    );
  }

  // Optional: Check if user completed the course
  const participation = await prisma.courseParticipation.findFirst({
    where: {
      courseId: data.courseId,
      userId: data.userId,
      status: 'COMPLETE',
    },
  });

  if (!participation) {
    throw new Error(
      'Kurs nicht abgeschlossen - Erfahrungsbericht erfordert Kursabschluss'
    );
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      courseId: data.courseId,
      userId: data.userId,
      authorName: data.authorName,
      authorRole: data.authorRole ?? null,
      authorImage: data.authorImage ?? null,
      content: data.content,
      rating: data.rating,
      isPublished: data.isPublished ?? false,
    },
  });

  return mapToTestimonial(testimonial);
}

/**
 * Update testimonial publish status
 *
 * @param testimonialId - The testimonial ID
 * @param isPublished - New publish status
 * @returns Updated testimonial
 */
export async function updateTestimonialStatus(
  testimonialId: string,
  isPublished: boolean
): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  if (!testimonial) {
    throw new Error('Erfahrungsbericht nicht gefunden');
  }

  const updated = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { isPublished },
  });

  return mapToTestimonial(updated);
}

/**
 * Delete a testimonial
 *
 * @param testimonialId - The testimonial ID
 */
export async function deleteTestimonial(testimonialId: string): Promise<void> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  if (!testimonial) {
    throw new Error('Erfahrungsbericht nicht gefunden');
  }

  await prisma.testimonial.delete({
    where: { id: testimonialId },
  });
}

/**
 * Get testimonial by ID
 *
 * @param testimonialId - The testimonial ID
 * @returns Testimonial or null
 */
export async function getTestimonialById(
  testimonialId: string
): Promise<Testimonial | null> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  return testimonial ? mapToTestimonial(testimonial) : null;
}
