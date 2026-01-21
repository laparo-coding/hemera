/**
 * Testimonial Zod Schemas
 * Feature: 017-testimonial-management
 *
 * Validation schemas for testimonial API endpoints.
 */

import { z } from 'zod';

/**
 * Schema for creating a new testimonial (user submission)
 */
export const createTestimonialSchema = z.object({
  content: z
    .string()
    .min(10, 'Erfahrungsbericht muss mindestens 10 Zeichen enthalten')
    .max(2000, 'Erfahrungsbericht darf maximal 2000 Zeichen enthalten'),
  rating: z
    .number()
    .int('Bewertung muss eine ganze Zahl sein')
    .min(1, 'Bewertung muss mindestens 1 sein')
    .max(5, 'Bewertung darf maximal 5 sein'),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

/**
 * Schema for admin status update
 */
export const adminUpdateTestimonialSchema = z.object({
  status: z.boolean({
    required_error: 'Status ist erforderlich',
    invalid_type_error: 'Status muss ein Boolean sein',
  }),
});

export type AdminUpdateTestimonialInput = z.infer<
  typeof adminUpdateTestimonialSchema
>;

/**
 * Schema for admin testimonial list filters
 */
export const testimonialFilterSchema = z.object({
  status: z
    .enum(['all', 'published', 'pending'])
    .optional()
    .default('all')
    .transform(val => (val === 'all' ? undefined : val === 'published')),
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type TestimonialFilterInput = z.infer<typeof testimonialFilterSchema>;
