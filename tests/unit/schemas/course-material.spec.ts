/**
 * Unit Tests for Course Material Schemas
 * Feature: 023-slide-editor, 026-course-material-integration
 */

import {
  courseMaterialCreateSchema,
  courseMaterialUpdateSchema,
  courseMaterialResponseSchema,
  identifierSchema,
  htmlContentSchema,
  generateSlug,
  slideControlFileSchema,
  MATERIAL_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
} from '@/lib/schemas/admin/course-material';
import type { MaterialType } from '@/lib/schemas/admin/course-material';

describe('identifierSchema', () => {
  it('accepts valid identifiers', () => {
    expect(identifierSchema.safeParse('test-material').success).toBe(true);
    expect(identifierSchema.safeParse('abc123').success).toBe(true);
    expect(identifierSchema.safeParse('my-course-intro').success).toBe(true);
  });

  it('normalizes uppercase to lowercase and accepts them', () => {
    // identifierSchema applies .toLowerCase() before regex validation
    const result = identifierSchema.safeParse('Test-Material');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test-material');
  });

  it('rejects identifiers with special characters', () => {
    const result = identifierSchema.safeParse('test_material');
    expect(result.success).toBe(false);
  });

  it('rejects identifiers with spaces', () => {
    const result = identifierSchema.safeParse('test material');
    expect(result.success).toBe(false);
  });

  it('rejects too short identifiers', () => {
    const result = identifierSchema.safeParse('a');
    expect(result.success).toBe(false);
  });

  it('rejects too long identifiers', () => {
    const longId = 'a'.repeat(101);
    const result = identifierSchema.safeParse(longId);
    expect(result.success).toBe(false);
  });
});

describe('htmlContentSchema', () => {
  it('accepts valid HTML content', () => {
    expect(htmlContentSchema.safeParse('<p>Hello</p>').success).toBe(true);
    expect(htmlContentSchema.safeParse('<h1>Title</h1><p>Content</p>').success).toBe(true);
  });

  it('accepts empty string', () => {
    expect(htmlContentSchema.safeParse('').success).toBe(true);
  });

  it('rejects content exceeding 2MB', () => {
    const largeContent = 'x'.repeat(2 * 1024 * 1024 + 1);
    const result = htmlContentSchema.safeParse(largeContent);
    expect(result.success).toBe(false);
  });
});

describe('courseMaterialCreateSchema', () => {
  it('accepts valid create payload', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test Material',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('accepts payload with custom identifier', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test Material',
      identifier: 'custom-id',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = courseMaterialCreateSchema.safeParse({
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });

  it('accepts missing htmlContent (optional for SLIDE_CONTROL)', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test',
      type: 'SLIDE_CONTROL',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: '',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'a'.repeat(201),
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });
});

describe('courseMaterialUpdateSchema', () => {
  it('accepts partial update with only title', () => {
    const result = courseMaterialUpdateSchema.safeParse({
      title: 'New Title',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only identifier', () => {
    const result = courseMaterialUpdateSchema.safeParse({
      identifier: 'new-id',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only htmlContent', () => {
    const result = courseMaterialUpdateSchema.safeParse({
      htmlContent: '<p>New content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = courseMaterialUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full update', () => {
    const result = courseMaterialUpdateSchema.safeParse({
      title: 'New Title',
      identifier: 'new-id',
      htmlContent: '<p>New content</p>',
    });
    expect(result.success).toBe(true);
  });
});

describe('courseMaterialResponseSchema', () => {
  it('validates complete response', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'CONTENT',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'CONTENT',
      blobUrl: 'not-a-url',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'CONTENT',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: 'not-a-date',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('generateSlug', () => {
  it('converts title to lowercase', () => {
    expect(generateSlug('Test Material')).toBe('test-material');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('My Test Material')).toBe('my-test-material');
  });

  it('removes special characters', () => {
    expect(generateSlug('Test! @Material#')).toBe('test-material');
  });

  it('converts German umlauts', () => {
    expect(generateSlug('Einführung')).toBe('einfuehrung');
    expect(generateSlug('Übersicht')).toBe('uebersicht');
    expect(generateSlug('Größe')).toBe('groesse');
  });

  it('converts ß to ss', () => {
    expect(generateSlug('Maßnahme')).toBe('massnahme');
  });

  it('handles multiple consecutive special characters', () => {
    expect(generateSlug('Test   Material')).toBe('test-material');
    expect(generateSlug('Test---Material')).toBe('test-material');
  });

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('-Test Material-')).toBe('test-material');
    expect(generateSlug('  Test Material  ')).toBe('test-material');
  });

  it('truncates to 100 characters', () => {
    const longTitle = 'a'.repeat(150);
    const result = generateSlug(longTitle);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(generateSlug('!@#$%')).toBe('');
  });
});

// ─── 026: Material Type Tests ──────────────────────────────────────────────

describe('constants', () => {
  describe('MATERIAL_TYPES constant', () => {
    it('contains expected values', () => {
      expect(MATERIAL_TYPES).toEqual(['CONTENT', 'SLIDE_CONTROL']);
    });
  });

  describe('MAX_FILE_SIZE constant', () => {
    it('equals 20 MB in bytes', () => {
      expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024);
    });
  });

  describe('ALLOWED_FILE_EXTENSIONS constant', () => {
    it('contains only .html', () => {
      expect(ALLOWED_FILE_EXTENSIONS).toEqual(['.html']);
    });
  });
});

describe('courseMaterialCreateSchema — type field', () => {
  it('accepts type CONTENT', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test',
      htmlContent: '<p>Content</p>',
      type: 'CONTENT',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('CONTENT');
  });

  it('accepts type SLIDE_CONTROL', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Slide Deck',
      type: 'SLIDE_CONTROL',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('SLIDE_CONTROL');
  });

  it('defaults to CONTENT when type omitted', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('CONTENT');
  });

  it('rejects invalid type value', () => {
    const result = courseMaterialCreateSchema.safeParse({
      title: 'Test',
      htmlContent: '<p>Content</p>',
      type: 'INVALID',
    });
    expect(result.success).toBe(false);
  });
});

describe('courseMaterialResponseSchema — type field', () => {
  it('accepts valid response with CONTENT type', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test',
      title: 'Test',
      type: 'CONTENT',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid response with SLIDE_CONTROL type', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_456',
      identifier: 'slides',
      title: 'Slides',
      type: 'SLIDE_CONTROL',
      blobUrl: 'https://blob.vercel-storage.com/slides.html',
      blobPathname: 'course-material/slides/slides.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects response without type field', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects response with invalid type', () => {
    const result = courseMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test',
      title: 'Test',
      type: 'UNKNOWN',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('slideControlFileSchema', () => {
  it('accepts valid .html file within size limit', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'presentation.html',
      type: 'text/html',
      size: 1024 * 1024, // 1 MB
    });
    expect(result.success).toBe(true);
  });

  it('accepts .HTML extension (case-insensitive)', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'PRESENTATION.HTML',
      type: 'text/html',
      size: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects .txt file', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'notes.txt',
      type: 'text/plain',
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects .pdf file', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects .js file', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'script.js',
      type: 'application/javascript',
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it('rejects file exceeding 20 MB', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'huge.html',
      type: 'text/html',
      size: MAX_FILE_SIZE + 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts file at exactly 20 MB', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'exact.html',
      type: 'text/html',
      size: MAX_FILE_SIZE,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-text/html MIME type even with .html extension', () => {
    const result = slideControlFileSchema.safeParse({
      name: 'fake.html',
      type: 'application/octet-stream',
      size: 1024,
    });
    expect(result.success).toBe(false);
  });
});
