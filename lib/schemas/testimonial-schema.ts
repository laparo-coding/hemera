/**
 * Testimonial Schemas - Zod validation schemas for Testimonial entity
 * Feature: 017-testimonial-management
 */

import { z } from 'zod';

// Enum for name display format options
export const nameDisplayFormatSchema = z.enum([
  'FULL_NAME_CITY',
  'FULL_NAME',
  'FIRST_INITIAL',
  'FIRST_NAME_ONLY',
]);

export type NameDisplayFormat = z.infer<typeof nameDisplayFormatSchema>;

// Enum for testimonial status
export const testimonialStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'PUBLISHED',
  'HIDDEN',
]);

export type TestimonialStatus = z.infer<typeof testimonialStatusSchema>;

// Schema for creating a new testimonial (user input)
export const createTestimonialSchema = z.object({
  bookingId: z.string().cuid('Ungültige Buchungs-ID'),
  statement: z
    .string()
    .min(10, 'Dein Erfahrungsbericht muss mindestens 10 Zeichen haben')
    .max(1000, 'Dein Erfahrungsbericht darf maximal 1000 Zeichen haben'),
  nameDisplayFormat: nameDisplayFormatSchema,
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

// Schema for updating a testimonial (user can edit statement and display format)
export const updateTestimonialSchema = z.object({
  statement: z
    .string()
    .min(10, 'Dein Erfahrungsbericht muss mindestens 10 Zeichen haben')
    .max(1000, 'Dein Erfahrungsbericht darf maximal 1000 Zeichen haben')
    .optional(),
  nameDisplayFormat: nameDisplayFormatSchema.optional(),
});

export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

// Schema for admin status update
export const adminUpdateTestimonialSchema = z.object({
  status: testimonialStatusSchema,
});

export type AdminUpdateTestimonialInput = z.infer<typeof adminUpdateTestimonialSchema>;

// Schema for filtering testimonials (API query params)
export const testimonialFilterSchema = z.object({
  courseId: z.string().cuid().optional(),
  status: testimonialStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type TestimonialFilter = z.infer<typeof testimonialFilterSchema>;

// Full testimonial response schema (for API responses)
export const testimonialResponseSchema = z.object({
  id: z.string().cuid(),
  bookingId: z.string().cuid(),
  courseId: z.string().cuid(),
  statement: z.string(),
  nameDisplayFormat: nameDisplayFormatSchema,
  cachedDisplayName: z.string(),
  cachedPhotoUrl: z.string().nullable(),
  cachedCity: z.string().nullable(),
  status: testimonialStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TestimonialResponse = z.infer<typeof testimonialResponseSchema>;

// Public testimonial for course detail page (only published, limited fields)
export const publicTestimonialSchema = z.object({
  id: z.string().cuid(),
  statement: z.string(),
  displayName: z.string(),
  photoUrl: z.string().nullable(),
  createdAt: z.date(),
});

export type PublicTestimonial = z.infer<typeof publicTestimonialSchema>;

// Helper to format display name based on format option
export function formatDisplayName(
  firstName: string,
  lastName: string,
  city: string | null | undefined,
  format: NameDisplayFormat
): string {
  switch (format) {
    case 'FULL_NAME_CITY':
      return city ? `${firstName} ${lastName}, ${city}` : `${firstName} ${lastName}`;
    case 'FULL_NAME':
      return `${firstName} ${lastName}`;
    case 'FIRST_INITIAL':
      return `${firstName} ${lastName.charAt(0)}.`;
    case 'FIRST_NAME_ONLY':
      return firstName;
  }
}

// Helper to check if a format option is available based on user profile
export function isFormatOptionAvailable(
  format: NameDisplayFormat,
  hasCity: boolean
): boolean {
  if (format === 'FULL_NAME_CITY') {
    return hasCity;
  }
  return true;
}
