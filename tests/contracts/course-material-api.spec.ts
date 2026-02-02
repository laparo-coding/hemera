/**
 * Seminarmaterial API Contract Tests
 * Feature: 023-slide-editor
 *
 * Contract tests for seminarmaterial API endpoints
 */

// Mock Prisma
const mockPrisma = {
  seminarMaterial: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Clerk auth
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock Vercel Blob
const mockPut = jest.fn();
const mockDel = jest.fn();
jest.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

// Mock Rollbar
jest.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/course-material/route';
import {
  GET as GET_SINGLE,
  PUT,
  DELETE,
} from '@/app/api/admin/course-material/[id]/route';
import { GET as GET_CONTENT } from '@/app/api/admin/course-material/[id]/content/route';
import { POST as POST_IMAGE } from '@/app/api/admin/course-material/images/route';

describe('GET /api/admin/course-material', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/admin/course-material');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns materials list for authenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findMany.mockResolvedValue([
      {
        id: 'mat_1',
        identifier: 'test-material',
        title: 'Test Material',
        blobUrl: 'https://blob.vercel-storage.com/test.html',
        blobPathname: 'course-material/test-material.html',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ]);

    const request = new NextRequest('http://localhost/api/admin/course-material');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.materials).toHaveLength(1);
    expect(json.materials[0].identifier).toBe('test-material');
  });

  it('returns empty list when no materials exist', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/admin/course-material');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.materials).toHaveLength(0);
  });
});

describe('POST /api/admin/course-material', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/admin/course-material', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', htmlContent: '<p>Test</p>' }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 400 for missing required fields', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });

    const request = new NextRequest('http://localhost/api/admin/course-material', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
  });

  it('creates material and uploads to blob', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    // isIdentifierTaken uses findUnique - return null for "not taken"
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/test-material.html',
      pathname: 'course-material/test-material.html',
    });
    mockPrisma.seminarMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl: 'https://blob.vercel-storage.com/course-material/test-material.html',
      blobPathname: 'course-material/test-material.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/admin/course-material', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Material',
        htmlContent: '<p>Test content</p>',
      }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.identifier).toBe('test-material');
    expect(mockPut).toHaveBeenCalledWith(
      'course-material/test-material.html',
      '<p>Test content</p>',
      expect.objectContaining({ access: 'public', contentType: 'text/html' })
    );
  });

  it('returns 409 for duplicate identifier', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    // isIdentifierTaken uses findUnique with { where: { identifier } }
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'existing',
      identifier: 'test-material',
    });

    const request = new NextRequest('http://localhost/api/admin/course-material', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Material',
        identifier: 'test-material',
        htmlContent: '<p>Test</p>',
      }),
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('conflict');
  });
});

describe('GET /api/admin/course-material/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1');
    const response = await GET_SINGLE(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_999');
    const response = await GET_SINGLE(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('returns material for valid id', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1');
    const response = await GET_SINGLE(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.id).toBe('mat_1');
    expect(json.title).toBe('Test Material');
  });
});

describe('PUT /api/admin/course-material/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_999', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const response = await PUT(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('updates material title', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Old Title',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.seminarMaterial.update.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'New Title',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'New Title' }),
    });
    const response = await PUT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.title).toBe('New Title');
  });

  it('uploads new content when htmlContent provided', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/old.html',
      blobPathname: 'course-material/old.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/new.html',
      pathname: 'course-material/test-material.html',
    });
    mockPrisma.seminarMaterial.update.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/new.html',
      blobPathname: 'course-material/test-material.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1', {
      method: 'PUT',
      body: JSON.stringify({ htmlContent: '<p>New content</p>' }),
    });
    const response = await PUT(request, { params: createParams('mat_1') });

    expect(response.status).toBe(200);
    expect(mockPut).toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/course-material/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_999', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('deletes material and blob file', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDel.mockResolvedValue(undefined);
    mockPrisma.seminarMaterial.delete.mockResolvedValue({});

    const request = new NextRequest('http://localhost/api/admin/course-material/mat_1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: createParams('mat_1') });

    expect(response.status).toBe(204);
    expect(mockDel).toHaveBeenCalledWith('https://blob.vercel-storage.com/test.html');
    expect(mockPrisma.seminarMaterial.delete).toHaveBeenCalledWith({
      where: { id: 'mat_1' },
    });
  });
});

describe('GET /api/admin/course-material/[id]/content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1/content'
    );
    const response = await GET_CONTENT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_999/content'
    );
    const response = await GET_CONTENT(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('fetches and returns HTML content from blob', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPrisma.seminarMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock global fetch for blob content
    const originalFetch = global.fetch;
    try {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<p>Test HTML content</p>'),
      });

      const request = new NextRequest(
        'http://localhost/api/admin/course-material/mat_1/content'
      );
      const response = await GET_CONTENT(request, { params: createParams('mat_1') });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.htmlContent).toBe('<p>Test HTML content</p>');
      expect(json.id).toBe('mat_1');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('POST /api/admin/course-material/images', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/images',
      { method: 'POST', body: formData }
    );
    const response = await POST_IMAGE(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 400 for missing file', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });

    const formData = new FormData();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/images',
      { method: 'POST', body: formData }
    );
    const response = await POST_IMAGE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
  });

  it('returns 400 for invalid file type', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['test'], { type: 'application/pdf' }),
      'test.pdf'
    );

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/images',
      { method: 'POST', body: formData }
    );
    const response = await POST_IMAGE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
  });

  it('uploads image and returns URL', async () => {
    mockAuth.mockResolvedValue({ userId: 'admin_123' });
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/images/123-abc.jpg',
      pathname: 'course-material/images/123-abc.jpg',
    });

    const imageBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
    Object.defineProperty(imageBlob, 'size', { value: 1024 }); // 1KB

    const formData = new FormData();
    formData.append('file', imageBlob, 'test.jpg');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/images',
      { method: 'POST', body: formData }
    );
    const response = await POST_IMAGE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toContain('blob.vercel-storage.com');
    expect(mockPut).toHaveBeenCalled();
  });
});
