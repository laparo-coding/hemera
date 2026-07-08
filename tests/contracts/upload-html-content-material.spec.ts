/**
 * Course Material HTML Content Upload Contract Tests
 * Feature: 030-extended-material-upload
 *
 * Contract tests for the HTML content file upload via FormData.
 * This tests the new upload pathway where CONTENT materials are created
 * from uploaded .html files (stored as-is, no sanitization).
 */

import { NextRequest } from 'next/server';
import '../helpers/course-material-mocks';
import { POST } from '@/app/api/admin/course-material/route';
import {
  mockAuthenticatedAdmin,
  mockPrisma,
  mockPut,
  mockUnauthenticated,
} from '../helpers/course-material-mocks';

const VALID_HTML_CONTENT = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Test</title></head>
<body><h1>Test Content</h1><p>Hello World</p></body>
</html>`;

function createFormDataRequest(
  title: string,
  file: File | null,
  identifier?: string
): NextRequest {
  const formData = new FormData();
  formData.append('title', title);
  if (identifier) {
    formData.append('identifier', identifier);
  }
  if (file) {
    formData.append('file', file);
  }
  // Append type to signal CONTENT upload via FormData
  formData.append('type', 'CONTENT');

  return new NextRequest('http://localhost/api/admin/course-material', {
    method: 'POST',
    body: formData,
  });
}

function createHtmlFile(
  content: string = VALID_HTML_CONTENT,
  name = 'test.html',
  type = 'text/html'
): File {
  return new File([content], name, { type });
}

describe('POST /api/admin/course-material (FormData CONTENT upload)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const file = createHtmlFile();
    const request = createFormDataRequest('Test Material', file);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('accepts FormData with title, identifier, file and returns 201', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null); // identifier not taken
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/test-material.html',
      pathname: 'course-material/content/test-material.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/test-material.html',
      blobPathname: 'course-material/content/test-material.html',
      htmlContent: null,
      createdAt: new Date('2026-07-08T10:00:00Z'),
      updatedAt: new Date('2026-07-08T10:00:00Z'),
    });

    const file = createHtmlFile();
    const request = createFormDataRequest(
      'Test Material',
      file,
      'test-material'
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.id).toBe('mat_new');
    expect(json.identifier).toBe('test-material');
    expect(json.title).toBe('Test Material');
    expect(json.type).toBe('CONTENT');
    expect(json.blobUrl).toContain('course-material/content/');
    expect(json.blobPathname).toBe(
      'course-material/content/test-material.html'
    );
  });

  it('rejects non-.html files with 400', async () => {
    mockAuthenticatedAdmin();

    const file = new File([VALID_HTML_CONTENT], 'test.txt', {
      type: 'text/plain',
    });
    const request = createFormDataRequest('Test Material', file);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('.html');
  });

  it('accepts files with non-standard MIME type when content is valid HTML', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/test-material.html',
      pathname: 'course-material/content/test-material.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/test-material.html',
      blobPathname: 'course-material/content/test-material.html',
      htmlContent: null,
      createdAt: new Date('2026-07-08T10:00:00Z'),
      updatedAt: new Date('2026-07-08T10:00:00Z'),
    });

    // .html extension but browser sent application/octet-stream (common)
    const file = new File([VALID_HTML_CONTENT], 'test.html', {
      type: 'application/octet-stream',
    });
    const request = createFormDataRequest(
      'Test Material',
      file,
      'test-material'
    );
    const response = await POST(request);
    const json = await response.json();

    // MIME type is not a gate — valid HTML content is accepted
    expect(response.status).toBe(201);
    expect(json.id).toBe('mat_new');
  });

  it('rejects files without HTML structure (binary disguised as .html)', async () => {
    mockAuthenticatedAdmin();

    // Binary content with .html extension but no HTML structure
    const binaryContent = '\x89PNG\r\n\x1a\n\x00\x00\x00';
    const file = new File([binaryContent], 'malicious.html', {
      type: 'text/html',
    });
    const request = createFormDataRequest('Test Material', file);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('HTML');
  });

  it('rejects files > 20 MB with 400', async () => {
    mockAuthenticatedAdmin();

    // Create a file larger than 20 MB
    const largeContent = 'x'.repeat(21 * 1024 * 1024);
    const file = new File([largeContent], 'large.html', {
      type: 'text/html',
    });
    const request = createFormDataRequest('Large Material', file);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('MB');
  });

  it('requires title field (400 when missing)', async () => {
    mockAuthenticatedAdmin();

    const file = createHtmlFile();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'CONTENT');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: formData,
      }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('Titel');
  });

  it('requires file field (400 when missing)', async () => {
    mockAuthenticatedAdmin();

    const formData = new FormData();
    formData.append('title', 'Test Material');
    formData.append('type', 'CONTENT');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: formData,
      }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('.html');
  });

  it('returns 409 for duplicate identifier', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'existing',
      identifier: 'test-material',
    });

    const file = createHtmlFile();
    const request = createFormDataRequest(
      'Test Material',
      file,
      'test-material'
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('conflict');
  });

  it('stores file in Blob under course-material/content/ path', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/my-content.html',
      pathname: 'course-material/content/my-content.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'my-content',
      title: 'My Content',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/my-content.html',
      blobPathname: 'course-material/content/my-content.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = createHtmlFile();
    const request = createFormDataRequest('My Content', file, 'my-content');
    await POST(request);

    expect(mockPut).toHaveBeenCalledWith(
      'course-material/content/my-content.html',
      VALID_HTML_CONTENT,
      expect.objectContaining({
        access: 'public',
        contentType: 'text/html',
      })
    );
  });

  it('creates DB record with type CONTENT and htmlContent null', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/test.html',
      pathname: 'course-material/content/test.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'test',
      title: 'Test',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/test.html',
      blobPathname: 'course-material/content/test.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = createHtmlFile();
    const request = createFormDataRequest('Test', file, 'test');
    await POST(request);

    expect(mockPrisma.courseMaterial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'CONTENT',
          blobPathname: 'course-material/content/test.html',
          blobUrl: expect.stringContaining('course-material/content/'),
        }),
      })
    );
  });

  it('returns 502 when Blob storage fails', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockRejectedValue(new Error('Blob storage unavailable'));

    const file = createHtmlFile();
    const request = createFormDataRequest('Test', file, 'test-blob-fail');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toBe('blob_error');
  });

  it('auto-generates identifier from title when not provided', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/content/advanced-css.html',
      pathname: 'course-material/content/advanced-css.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'advanced-css',
      title: 'Advanced CSS',
      type: 'CONTENT',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/content/advanced-css.html',
      blobPathname: 'course-material/content/advanced-css.html',
      htmlContent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = createHtmlFile();
    const request = createFormDataRequest('Advanced CSS', file);
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.identifier).toBe('advanced-css');
  });
});
