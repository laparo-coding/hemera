/**
 * Testimonial Service - Business logic for Testimonial entity
 * Feature: 017-testimonial-management
 */

import type {
  NameDisplayFormat,
  Testimonial,
  TestimonialStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  formatDisplayName,
  type CreateTestimonialInput,
  type UpdateTestimonialInput,
  type PublicTestimonial,
} from '@/lib/schemas/testimonial-schema';

// Re-export types from Prisma
export type { Testimonial, NameDisplayFormat, TestimonialStatus } from '@prisma/client';

export interface TestimonialWithCourse extends Testimonial {
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface TestimonialCreateData {
  bookingId: string;
  courseId: string;
  statement: string;
  nameDisplayFormat: NameDisplayFormat;
  cachedDisplayName: string;
  cachedPhotoUrl?: string | null;
  cachedCity?: string | null;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  city?: string | null;
}

/**
 * Create a new testimonial for a booking
 * Validates that the booking exists and belongs to the user
 */
export async function createTestimonial(
  input: CreateTestimonialInput,
  userProfile: UserProfile
): Promise<Testimonial> {
  // Get the booking to verify ownership and get courseId
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      testimonial: true,
    },
  });

  if (!booking) {
    throw new Error('Buchung nicht gefunden');
  }

  // Check if testimonial already exists for this booking
  if (booking.testimonial) {
    throw new Error('Du hast bereits einen Erfahrungsbericht für diesen Kurs erstellt');
  }

  // Format the display name based on selected format
  const cachedDisplayName = formatDisplayName(
    userProfile.firstName,
    userProfile.lastName,
    userProfile.city,
    input.nameDisplayFormat
  );

  const testimonial = await prisma.testimonial.create({
    data: {
      bookingId: input.bookingId,
      courseId: booking.courseId,
      statement: input.statement,
      nameDisplayFormat: input.nameDisplayFormat,
      cachedDisplayName,
      cachedPhotoUrl: userProfile.imageUrl,
      cachedCity: userProfile.city,
      status: 'DRAFT',
    },
  });

  return testimonial;
}

/**
 * Update an existing testimonial
 * Only the statement and display format can be changed
 * After edit, status resets to DRAFT if it was PUBLISHED
 */
export async function updateTestimonial(
  testimonialId: string,
  userId: string,
  input: UpdateTestimonialInput,
  userProfile: UserProfile
): Promise<Testimonial> {
  // First verify ownership through booking
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
    include: {
      booking: true,
    },
  });

  if (!testimonial) {
    throw new Error('Erfahrungsbericht nicht gefunden');
  }

  if (testimonial.booking.userId !== userId) {
    throw new Error('Du hast keine Berechtigung, diesen Erfahrungsbericht zu bearbeiten');
  }

  // Prepare update data
  const updateData: Partial<{
    statement: string;
    nameDisplayFormat: NameDisplayFormat;
    cachedDisplayName: string;
    cachedPhotoUrl: string | null;
    cachedCity: string | null;
    status: TestimonialStatus;
  }> = {};

  if (input.statement !== undefined) {
    updateData.statement = input.statement;
  }

  if (input.nameDisplayFormat !== undefined) {
    updateData.nameDisplayFormat = input.nameDisplayFormat;
    updateData.cachedDisplayName = formatDisplayName(
      userProfile.firstName,
      userProfile.lastName,
      userProfile.city,
      input.nameDisplayFormat
    );
    updateData.cachedPhotoUrl = userProfile.imageUrl;
    updateData.cachedCity = userProfile.city;
  }

  // If the testimonial was published, reset to PENDING for re-approval
  if (testimonial.status === 'PUBLISHED') {
    updateData.status = 'PENDING';
  }

  const updated = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: updateData,
  });

  return updated;
}

/**
 * Submit a draft testimonial for admin approval
 */
export async function submitTestimonialForApproval(
  testimonialId: string,
  userId: string
): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
    include: {
      booking: true,
    },
  });

  if (!testimonial) {
    throw new Error('Erfahrungsbericht nicht gefunden');
  }

  if (testimonial.booking.userId !== userId) {
    throw new Error('Du hast keine Berechtigung, diesen Erfahrungsbericht einzureichen');
  }

  if (testimonial.status !== 'DRAFT') {
    throw new Error('Nur Entwürfe können zur Freigabe eingereicht werden');
  }

  const updated = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { status: 'PENDING' },
  });

  return updated;
}

/**
 * Get a testimonial by ID
 */
export async function getTestimonialById(
  testimonialId: string
): Promise<TestimonialWithCourse | null> {
  return prisma.testimonial.findUnique({
    where: { id: testimonialId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

/**
 * Get testimonial for a specific booking
 */
export async function getTestimonialByBookingId(
  bookingId: string
): Promise<Testimonial | null> {
  return prisma.testimonial.findUnique({
    where: { bookingId },
  });
}

/**
 * Get all testimonials for a user (through their bookings)
 */
export async function getTestimonialsByUserId(
  userId: string
): Promise<TestimonialWithCourse[]> {
  return prisma.testimonial.findMany({
    where: {
      booking: {
        userId,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get published testimonials for a course (public display)
 */
export async function getPublishedTestimonialsForCourse(
  courseId: string,
  limit = 10
): Promise<PublicTestimonial[]> {
  const testimonials = await prisma.testimonial.findMany({
    where: {
      courseId,
      status: 'PUBLISHED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return testimonials.map((t) => ({
    id: t.id,
    statement: t.statement,
    displayName: t.cachedDisplayName,
    photoUrl: t.cachedPhotoUrl,
    createdAt: t.createdAt,
  }));
}

/**
 * Admin: Get all testimonials with filtering
 */
export async function getTestimonialsForAdmin(options: {
  status?: TestimonialStatus;
  courseId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ testimonials: TestimonialWithCourse[]; total: number }> {
  const where: {
    status?: TestimonialStatus;
    courseId?: string;
  } = {};

  if (options.status) {
    where.status = options.status;
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
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit ?? 20,
      skip: options.offset ?? 0,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { testimonials, total };
}

/**
 * Admin: Update testimonial status
 */
export async function updateTestimonialStatus(
  testimonialId: string,
  status: TestimonialStatus
): Promise<Testimonial> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  if (!testimonial) {
    throw new Error('Erfahrungsbericht nicht gefunden');
  }

  return prisma.testimonial.update({
    where: { id: testimonialId },
    data: { status },
  });
}

/**
 * Count pending testimonials (for admin dashboard badge)
 */
export async function countPendingTestimonials(): Promise<number> {
  return prisma.testimonial.count({
    where: { status: 'PENDING' },
  });
}
