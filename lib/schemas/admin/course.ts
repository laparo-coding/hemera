import { z } from 'zod';

// Small buffer to allow for clock skew and short persistence delays when
// validating start times. Values within this buffer (ms) are considered valid.
export const VALIDATION_TIME_BUFFER_MS = 60_000; // 1 minute

/**
 * Course Level Enum
 */
export const CourseLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type CourseLevel = z.infer<typeof CourseLevelEnum>;

/**
 * Curriculum Topic Schema
 */
export const curriculumTopicSchema = z.object({
  id: z.string(),
  timeRange: z.string(),
  title: z.string(),
});

/**
 * Curriculum Module Schema
 */
export const curriculumModuleSchema = z.object({
  id: z.string(),
  day: z.number().int().positive(),
  title: z.string(),
  topics: z.array(curriculumTopicSchema),
});

/**
 * Curriculum Schema (array of modules)
 */
export const curriculumSchema = z
  .array(curriculumModuleSchema)
  .optional()
  .nullable();

export type CurriculumTopic = z.infer<typeof curriculumTopicSchema>;
export type CurriculumModule = z.infer<typeof curriculumModuleSchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;

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
    .min(3, 'Titel muss mindestens 3 Zeichen haben')
    .max(50, 'Titel darf maximal 50 Zeichen haben')
    .trim(),
  description: z
    .string()
    .min(10, 'Beschreibung muss mindestens 10 Zeichen haben')
    .max(900, 'Beschreibung darf maximal 900 Zeichen haben')
    .trim(),
  teaser: z
    .string()
    .max(200, 'Teaser darf maximal 200 Zeichen haben')
    .trim()
    .optional()
    .nullable(),
  price: z
    .number()
    .nonnegative('Price must be non-negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .transform(val => Math.round(val * 100)), // Convert Euro to Cents for Stripe
  startDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  endDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  startTime: z
    .union([z.string(), z.date()])
    .transform(
      (val): Date => (typeof val === 'string' ? new Date(val) : (val as Date))
    )
    .refine(date => date.getTime() > Date.now() + VALIDATION_TIME_BUFFER_MS, {
      message: 'Startzeit muss in der Zukunft liegen',
    }),
  endTime: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
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
    .int('Kapazität muss eine ganze Zahl sein')
    .min(0, 'Kapazität darf nicht negativ sein'),
  isPublished: z.boolean().default(false),
  locationId: z
    .string()
    .cuid('Location ID must be a valid CUID')
    .optional()
    .nullable(),
  curriculum: curriculumSchema,
  duration: z
    .number()
    .int('Dauer muss eine ganze Zahl in Stunden sein')
    .positive('Dauer muss positiv sein')
    .optional()
    .default(4),
  // Learning Path fields (021)
  recommended: z
    .string()
    .max(300, 'Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .min(1, 'Empfehlung darf nicht leer sein')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val || null),
  notRecommended: z
    .string()
    .max(300, 'Nicht-Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .min(1, 'Nicht-Empfehlung darf nicht leer sein')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val || null),
  isNonPublic: z.boolean().default(false),
});

/**
 * Zod Schema for Course Updates
 * All fields optional except updatedAt (for optimistic locking)
 */
export const courseUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must not exceed 50 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(900, 'Description must not exceed 900 characters')
    .trim()
    .optional(),
  teaser: z
    .string()
    .max(200, 'Teaser must not exceed 200 characters')
    .trim()
    .optional()
    .nullable(),
  price: z
    .number()
    .nonnegative('Price must be non-negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .optional()
    .transform(val => (val === undefined ? undefined : Math.round(val * 100))),
  startDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform(val => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  startTime: z
    .union([z.string(), z.date()])
    .transform(
      (val): Date => (typeof val === 'string' ? new Date(val) : (val as Date))
    )
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
    .int('Kapazität muss eine ganze Zahl sein')
    .nonnegative('Kapazität darf nicht negativ sein')
    .optional(),
  isPublished: z.boolean().optional(),
  locationId: z
    .string()
    .cuid('Location ID must be a valid CUID')
    .optional()
    .nullable(),
  curriculum: curriculumSchema,
  // Learning Path fields (021)
  recommended: z
    .string()
    .max(300, 'Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .min(1, 'Empfehlung darf nicht leer sein')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val || null),
  notRecommended: z
    .string()
    .max(300, 'Nicht-Empfehlung darf maximal 300 Zeichen haben')
    .trim()
    .min(1, 'Nicht-Empfehlung darf nicht leer sein')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform(val => val || null),
  isNonPublic: z.boolean().optional(),
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
