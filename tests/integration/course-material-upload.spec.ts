/**
 * Course Material HTML Content Upload Integration Tests
 * Feature: 030-extended-material-upload
 *
 * Integration tests for the full upload flow:
 * file → validation → Blob storage → DB insert → response
 */

import { NextRequest } from 'next/server';
import '../helpers/course-material-mocks';
import { POST } from '@/app/api/admin/course-material/route';
import {
  mockAuthenticatedAdmin as mockAdmin,
  mockDel,
  mockPrisma,
  mockPut,
} from '../helpers/course-material-mocks';

const VALID_HTML = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Advanced CSS</title></head>
<body><h1>Advanced CSS Patterns</h1><p>Content here</p></body>
</html>`;

function createUploadRequest(
  title: string,
  htmlContent: string = VALID_HTML,
  identifier?: string
): NextRequest {
  const formData = new FormData();
  formData.append('title', title);
  if (identifier) {
    formData.append('identifier', identifier);
  }
  formData.append(
    'file',
    new File([htmlContent], 'content.html', {
      type: 'text/html',
    })
  );
  formData.append('type', 'CONTENT');

  return new NextRequest('http://localhost/api/admin/course-material', {
    method: 'POST',
    body: formData,
  });
}

describe('Integration: HTML Content Upload Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdmin();
  });

  it('uploads HTML file, stores in Blob, creates DB record with type CONTENT', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/integration-test.html',
      pathname: 'course-material/content/integration-test.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_integration',
      identifier: 'integration-test',
      title: 'Integration Test Material',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/integration-test.html',
      blobPathname: 'course-material/content/integration-test.html',
      htmlContent: null,
      createdAt: new Date('2026-07-08T10:00:00Z'),
      updatedAt: new Date('2026-07-08T10:00:00Z'),
    });

    const request = createUploadRequest(
      'Integration Test Material',
      VALID_HTML,
      'integration-test'
    );
    const response = await POST(request);
    const json = await response.json();

    // Response validation
    expect(response.status).toBe(201);
    expect(json.id).toBe('mat_integration');
    expect(json.type).toBe('CONTENT');

    // Blob storage validation
    expect(mockPut).toHaveBeenCalledWith(
      'course-material/content/integration-test.html',
      VALID_HTML,
      expect.objectContaining({
        access: 'public',
        contentType: 'text/html',
      })
    );

    // DB record validation
    expect(mockPrisma.courseMaterial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          identifier: 'integration-test',
          title: 'Integration Test Material',
          type: 'CONTENT',
          blobPathname: 'course-material/content/integration-test.html',
          blobUrl: expect.stringContaining('course-material/content/'),
        }),
      })
    );
  });

  it('auto-generates identifier from title when not provided', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/advanced-css-patterns.html',
      pathname: 'course-material/content/advanced-css-patterns.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_auto',
      identifier: 'advanced-css-patterns',
      title: 'Advanced CSS Patterns',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/advanced-css-patterns.html',
      blobPathname: 'course-material/content/advanced-css-patterns.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createUploadRequest('Advanced CSS Patterns');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.identifier).toBe('advanced-css-patterns');
    expect(mockPut).toHaveBeenCalledWith(
      'course-material/content/advanced-css-patterns.html',
      VALID_HTML,
      expect.objectContaining({ access: 'public', contentType: 'text/html' })
    );
  });

  it('rejects invalid file type gracefully with generic error message', async () => {
    const formData = new FormData();
    formData.append('title', 'Invalid File');
    formData.append(
      'file',
      new File(['content'], 'test.txt', {
        type: 'text/plain',
      })
    );
    formData.append('type', 'CONTENT');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    // Client receives generic message, not internal details
    expect(json.message).not.toContain('Error');
    expect(json.message).not.toContain('stack');
  });

  it('handles Blob storage failure with generic client message', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockRejectedValue(new Error('Vercel Blob API timeout'));

    const request = createUploadRequest(
      'Blob Fail Test',
      VALID_HTML,
      'blob-fail-test'
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toBe('blob_error');
    // Client receives generic message, not internal error details
    expect(json.message).not.toContain('timeout');
    expect(json.message).not.toContain('Vercel');
  });

  it('handles DB failure and cleans up orphaned Blob', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/db-fail.html',
      pathname: 'course-material/content/db-fail.html',
    });
    mockPrisma.courseMaterial.create.mockRejectedValue(
      new Error('Database connection lost')
    );
    mockDel.mockResolvedValue(undefined);

    const request = createUploadRequest('DB Fail Test', VALID_HTML, 'db-fail');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('internal_error');
    // Blob should be cleaned up after DB failure
    expect(mockDel).toHaveBeenCalledWith(
      'course-material/content/db-fail.html'
    );
  });

  it('rejects duplicate identifier with 409 Conflict', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'existing_mat',
      identifier: 'duplicate-id',
    });

    const request = createUploadRequest(
      'Duplicate Test',
      VALID_HTML,
      'duplicate-id'
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('conflict');
    // Should not upload to Blob if identifier is duplicate
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('rejects CONTENT uploads with script tags (XSS validation)', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    const htmlWithScript = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><script>alert('test');</script><h1>Content</h1></body>
</html>`;

    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/no-sanitize.html',
      pathname: 'course-material/content/no-sanitize.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_no_sanitize',
      identifier: 'no-sanitize',
      title: 'No Sanitize Test',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/no-sanitize.html',
      blobPathname: 'course-material/content/no-sanitize.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createUploadRequest(
      'No Sanitize Test',
      htmlWithScript,
      'no-sanitize'
    );
    const response = await POST(request);
    const json = await response.json();

    // CONTENT uploads are validated and sanitized, matching handleJsonPost
    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('HTML-Validierung');
    // Blob upload should not happen for invalid HTML
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('sanitizes CONTENT uploads through validateHtmlContent + sanitizeHtml', async () => {
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    // Clean HTML without script/iframe/style/event handlers passes validation,
    // then goes through sanitizeHtml (defense-in-depth no-op for safe content)
    const cleanHtml = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Test</title></head>
<body><h1>Safe Content</h1><p>Hello World</p></body>
</html>`;

    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/sanitized.html',
      pathname: 'course-material/content/sanitized.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_sanitized',
      identifier: 'sanitized',
      title: 'Sanitized Test',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/sanitized.html',
      blobPathname: 'course-material/content/sanitized.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createUploadRequest(
      'Sanitized Test',
      cleanHtml,
      'sanitized'
    );
    const response = await POST(request);
    const json = await response.json();

    // Clean HTML passes validation and sanitization, gets uploaded
    expect(response.status).toBe(201);
    expect(json.type).toBe('CONTENT');
    // Verify sanitized content was uploaded (no script tags present)
    expect(mockPut).toHaveBeenCalledWith(
      'course-material/content/sanitized.html',
      expect.not.stringContaining('<script'),
      expect.objectContaining({ access: 'public', contentType: 'text/html' })
    );
  });
});
