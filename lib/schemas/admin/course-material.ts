/**
 * Course Material Validation Schemas
 * Feature: 023-slide-editor, 026-course-material-integration
 */

import { z } from 'zod';

// ─── Material Type Constants ────────────────────────────────────────────────

/** Allowed material type values */
export const MATERIAL_TYPES = ['CONTENT', 'SLIDE_CONTROL'] as const;

/** TypeScript type for material types */
export type MaterialType = (typeof MATERIAL_TYPES)[number];

/** Maximum file size for slide control uploads: 20 MB */
export const MAX_FILE_SIZE = 20_971_520;

/** Allowed file extensions for slide control uploads */
export const ALLOWED_FILE_EXTENSIONS = ['.html'] as const;

// ─── Base Schemas ───────────────────────────────────────────────────────────

/**
 * Identifier schema for course materials
 * - lowercase, hyphens, alphanumeric
 * - 2-100 characters
 */
export const identifierSchema = z
  .string()
  .toLowerCase()
  .regex(
    /^[a-z0-9-]+$/,
    'Identifier muss aus Kleinbuchstaben, Zahlen und Bindestrichen bestehen'
  )
  .min(2, 'Identifier muss mindestens 2 Zeichen lang sein')
  .max(100, 'Identifier darf maximal 100 Zeichen lang sein');

/**
 * HTML content schema for materials
 * - max 2MB (2097152 bytes)
 */
export const htmlContentSchema = z
  .string()
  .refine(
    value => new TextEncoder().encode(value).length <= 2097152,
    'HTML-Inhalt darf maximal 2MB groß sein'
  );

/**
 * Schema for validating slide control file uploads
 * - extension must be .html
 * - MIME must be text/html
 * - size must be ≤ MAX_FILE_SIZE (20 MB)
 */
export const slideControlFileSchema = z.object({
  name: z
    .string()
    .refine(
      name =>
        ALLOWED_FILE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext)),
      `Datei muss eine der folgenden Endungen haben: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
    ),
  type: z
    .string()
    .refine(
      mime => /^text\/html(?:\s*;|$)/i.test(mime),
      'Datei muss vom Typ text/html sein'
    ),
  size: z
    .number()
    .max(
      MAX_FILE_SIZE,
      `Datei darf maximal ${MAX_FILE_SIZE / 1024 / 1024} MB groß sein`
    ),
});

// ─── Composite Schemas ──────────────────────────────────────────────────────

/**
 * Schema for creating a new course material
 * Uses discriminated union based on type:
 * - CONTENT: htmlContent is required (default type)
 * - SLIDE_CONTROL: htmlContent is optional (file uploaded separately)
 * Type defaults to 'CONTENT' if omitted
 */
export const courseMaterialCreateSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Titel ist erforderlich')
      .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
    identifier: identifierSchema.optional(),
    type: z.enum(['CONTENT', 'SLIDE_CONTROL']).optional().default('CONTENT'),
    htmlContent: htmlContentSchema.optional(),
  })
  .refine(
    data => {
      if (data.type === 'CONTENT') {
        return !!data.htmlContent;
      }
      return true;
    },
    {
      message: 'htmlContent ist erforderlich für CONTENT-Materialien',
      path: ['htmlContent'],
    }
  );

/**
 * Schema for updating a course material
 * Note: type cannot be changed after creation
 */
export const courseMaterialUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein')
    .optional(),
  identifier: identifierSchema.optional(),
  htmlContent: htmlContentSchema.optional(),
});

/**
 * Schema for course material response (from API)
 */
export const courseMaterialResponseSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  type: z.enum(MATERIAL_TYPES),
  blobUrl: z.string().url(),
  blobPathname: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Generate a slug identifier from a title
 * Converts to lowercase, removes special chars, replaces spaces with hyphens
 * Handles German umlauts
 */
export function generateSlug(title: string): string {
  if (!title) return '';

  return (
    title
      // Convert German umlauts (lowercase and uppercase)
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      // Convert to lowercase
      .toLowerCase()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove all characters except alphanumeric and hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Truncate to 100 characters
      .slice(0, 100)
  );
}
