import { z } from 'zod';

/**
 * Course Level Enum
 */
export const CourseLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type CourseLevel = z.infer<typeof CourseLevelEnum>;

/**
 * Inferred type from courseCreateSchema
 */

/**
 * Zod Schema for Course Creation
 * Validates all required fields before course creation
 */
export const courseCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .trim(),
  price: z
    .number()
    .nonnegative('Price must be non-negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .transform(val => Math.round(val * 100)), // Convert Euro to Cents for Stripe
  startDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val)),
  startTime: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val)),
  endTime: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val)),
  instructor: z
    .string()
    .min(2, 'Instructor name must be at least 2 characters')
    .trim(),
  level: CourseLevelEnum,
  thumbnailUrl: z
    .string()
    .url('Thumbnail must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Thumbnail must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  imageDetail: z
    .string()
    .url('Detail image must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Detail image must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  imageTwitter: z
    .string()
    .url('Twitter image must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Twitter image must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive'),
  isPublished: z.boolean().default(false),
  locationId: z
    .string()
    .cuid('Location ID must be a valid CUID')
    .optional()
    .nullable(),
});

/**
 * Zod Schema for Course Updates
 * All fields optional except updatedAt (for optimistic locking)
 */
export const courseUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .trim()
    .optional(),
  price: z
    .number()
    .nonnegative('Price must be non-negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  startTime: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  endTime: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  instructor: z
    .string()
    .min(2, 'Instructor name must be at least 2 characters')
    .trim()
    .optional(),
  level: CourseLevelEnum.optional(),
  thumbnailUrl: z
    .string()
    .url('Thumbnail must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Thumbnail must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  imageDetail: z
    .string()
    .url('Detail image must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Detail image must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  imageTwitter: z
    .string()
    .url('Twitter image must be a valid URL')
    .regex(
      /^https:\/\/.*\.vercel-storage\.com\/.*/,
      'Twitter image must be from Vercel Blob storage'
    )
    .optional()
    .nullable(),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .optional(),
  isPublished: z.boolean().optional(),
  locationId: z
    .string()
    .cuid('Location ID must be a valid CUID')
    .optional()
    .nullable(),
  updatedAt: z.coerce.date(), // Required for optimistic locking
});

/**
 * Zod Schema for Enrollment Transfer
 */
export const enrollmentTransferSchema = z.object({
  targetCourseId: z.string().cuid('Target course ID must be a valid CUID'),
});

// Export inferred TypeScript types
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type EnrollmentTransferInput = z.infer<typeof enrollmentTransferSchema>;
