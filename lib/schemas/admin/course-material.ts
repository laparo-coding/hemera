/**
 * Course Material Validation Schemas
 * Feature: 023-slide-editor
 */

import { z } from 'zod';

/**
 * Material type union - defines the available course material types
 */
export type MaterialType = 'CONTENT' | 'SLIDE_CONTROL';

/**
 * Allowed file extensions for uploads
 */
export const ALLOWED_FILE_EXTENSIONS = ['.html'];

/**
 * Maximum file size in bytes (2MB)
 */
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
 * Schema for creating a new course material
 */
export const courseMaterialCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(200, 'Titel darf maximal 200 Zeichen lang sein'),
  identifier: identifierSchema.optional(),
  htmlContent: htmlContentSchema,
});

/**
 * Schema for updating a course material
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
