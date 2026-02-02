/**
 * Unit Tests for Seminarmaterial Schemas
 * Feature: 023-slide-editor
 */

import {
  seminarMaterialCreateSchema,
  seminarMaterialUpdateSchema,
  seminarMaterialResponseSchema,
  identifierSchema,
  htmlContentSchema,
  generateSlug,
} from '@/lib/schemas/admin/course-material';

describe('identifierSchema', () => {
  it('accepts valid identifiers', () => {
    expect(identifierSchema.safeParse('test-material').success).toBe(true);
    expect(identifierSchema.safeParse('abc123').success).toBe(true);
    expect(identifierSchema.safeParse('my-course-intro').success).toBe(true);
  });

  it('rejects identifiers with uppercase', () => {
    const result = identifierSchema.safeParse('Test-Material');
    expect(result.success).toBe(false);
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

describe('seminarMaterialCreateSchema', () => {
  it('accepts valid create payload', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      title: 'Test Material',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('accepts payload with custom identifier', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      title: 'Test Material',
      identifier: 'custom-id',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing htmlContent', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      title: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      title: '',
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 200 characters', () => {
    const result = seminarMaterialCreateSchema.safeParse({
      title: 'a'.repeat(201),
      htmlContent: '<p>Content</p>',
    });
    expect(result.success).toBe(false);
  });
});

describe('seminarMaterialUpdateSchema', () => {
  it('accepts partial update with only title', () => {
    const result = seminarMaterialUpdateSchema.safeParse({
      title: 'New Title',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only identifier', () => {
    const result = seminarMaterialUpdateSchema.safeParse({
      identifier: 'new-id',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only htmlContent', () => {
    const result = seminarMaterialUpdateSchema.safeParse({
      htmlContent: '<p>New content</p>',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = seminarMaterialUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full update', () => {
    const result = seminarMaterialUpdateSchema.safeParse({
      title: 'New Title',
      identifier: 'new-id',
      htmlContent: '<p>New content</p>',
    });
    expect(result.success).toBe(true);
  });
});

describe('seminarMaterialResponseSchema', () => {
  it('validates complete response', () => {
    const result = seminarMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = seminarMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl: 'not-a-url',
      blobPathname: 'course-material/test.html',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime', () => {
    const result = seminarMaterialResponseSchema.safeParse({
      id: 'mat_123',
      identifier: 'test-material',
      title: 'Test Material',
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
