/**
 * Course Material API Contract Tests
 * Feature: 023-slide-editor
 *
 * Contract tests for course material API endpoints
 */

// Mock Prisma
const mockPrisma = {
  courseMaterial: {
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

// Mock Auth helpers — routes use requireAdminUser() from @/lib/auth/helpers
const mockRequireAdminUser = jest.fn();
jest.mock('@/lib/auth/helpers', () => ({
  requireAdminUser: () => mockRequireAdminUser(),
}));

// Helpers for setting auth mock state
function mockUnauthenticated() {
  mockRequireAdminUser.mockResolvedValue({
    authorized: false,
    userId: null,
    response: NextResponse.json(
      { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
      { status: 401 }
    ),
  });
}

function mockAuthenticatedAdmin(userId = 'admin_123') {
  mockRequireAdminUser.mockResolvedValue({
    authorized: true,
    userId,
    user: { id: userId, publicMetadata: { role: 'admin' } },
  });
}

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
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET as GET_CONTENT } from '@/app/api/admin/course-material/[id]/content/route';
import {
  DELETE,
  GET as GET_SINGLE,
  PUT,
} from '@/app/api/admin/course-material/[id]/route';
import { POST as POST_IMAGE } from '@/app/api/admin/course-material/images/route';
import { GET, POST } from '@/app/api/admin/course-material/route';

// Shared helper for creating params promise (Next.js 15 dynamic route params)
const createParams = (id: string) => Promise.resolve({ id });

describe('GET /api/admin/course-material', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns materials list for authenticated request', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findMany.mockResolvedValue([
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

    const _request = new NextRequest(
      'http://localhost/api/admin/course-material'
    );
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.materials).toHaveLength(1);
    expect(json.materials[0].identifier).toBe('test-material');
  });

  it('returns empty list when no materials exist', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findMany.mockResolvedValue([]);

    const _request = new NextRequest(
      'http://localhost/api/admin/course-material'
    );
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
    mockUnauthenticated();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', htmlContent: '<p>Test</p>' }),
      }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 400 for missing required fields', async () => {
    mockAuthenticatedAdmin();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
  });

  it('creates material and uploads to blob', async () => {
    mockAuthenticatedAdmin();
    // isIdentifierTaken uses findUnique - return null for "not taken"
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/test-material.html',
      pathname: 'course-material/test-material.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_new',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/test-material.html',
      blobPathname: 'course-material/test-material.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Material',
          htmlContent: '<p>Test content</p>',
        }),
      }
    );
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
    mockAuthenticatedAdmin();
    // isIdentifierTaken uses findUnique with { where: { identifier } }
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'existing',
      identifier: 'test-material',
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Material',
          identifier: 'test-material',
          htmlContent: '<p>Test</p>',
        }),
      }
    );
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

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1'
    );
    const response = await GET_SINGLE(request, {
      params: createParams('mat_1'),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_999'
    );
    const response = await GET_SINGLE(request, {
      params: createParams('mat_999'),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('returns material for valid id', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test Material',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1'
    );
    const response = await GET_SINGLE(request, {
      params: createParams('mat_1'),
    });
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

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }
    );
    const response = await PUT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_999',
      {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }
    );
    const response = await PUT(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('updates material title', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Old Title',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.courseMaterial.update.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'New Title',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
      }
    );
    const response = await PUT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.title).toBe('New Title');
  });

  it('uploads new content when htmlContent provided', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
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
    mockPrisma.courseMaterial.update.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/new.html',
      blobPathname: 'course-material/test-material.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'PUT',
        body: JSON.stringify({ htmlContent: '<p>New content</p>' }),
      }
    );
    const response = await PUT(request, { params: createParams('mat_1') });

    expect(response.status).toBe(200);
    expect(mockPut).toHaveBeenCalled();
  });

  it('returns 400 for empty update payload', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'PUT',
        body: JSON.stringify({}),
      }
    );
    const response = await PUT(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('Mindestens ein Feld');
  });
});

describe('DELETE /api/admin/course-material/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'DELETE',
      }
    );
    const response = await DELETE(request, { params: createParams('mat_1') });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_999',
      {
        method: 'DELETE',
      }
    );
    const response = await DELETE(request, { params: createParams('mat_999') });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('deletes material and blob file', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test',
      blobUrl: 'https://blob.vercel-storage.com/test.html',
      blobPathname: 'course-material/test.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDel.mockResolvedValue(undefined);
    mockPrisma.courseMaterial.delete.mockResolvedValue({});

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1',
      {
        method: 'DELETE',
      }
    );
    const response = await DELETE(request, { params: createParams('mat_1') });

    expect(response.status).toBe(204);
    expect(mockDel).toHaveBeenCalledWith(
      'https://blob.vercel-storage.com/test.html'
    );
    expect(mockPrisma.courseMaterial.delete).toHaveBeenCalledWith({
      where: { id: 'mat_1' },
    });
  });
});

describe('GET /api/admin/course-material/[id]/content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockUnauthenticated();

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1/content'
    );
    const response = await GET_CONTENT(request, {
      params: createParams('mat_1'),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('unauthorized');
  });

  it('returns 404 for non-existent material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_999/content'
    );
    const response = await GET_CONTENT(request, {
      params: createParams('mat_999'),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('not_found');
  });

  it('fetches and returns HTML content from blob', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
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
      const response = await GET_CONTENT(request, {
        params: createParams('mat_1'),
      });
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
    mockUnauthenticated();

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['test'], { type: 'image/jpeg' }),
      'test.jpg'
    );

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
    mockAuthenticatedAdmin();

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
    mockAuthenticatedAdmin();

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
    mockAuthenticatedAdmin();
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

// ─── 026: T006 — GET endpoints return type field ────────────────────────────

describe('026: GET /api/admin/course-material — type field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes type field in materials list response', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findMany.mockResolvedValue([
      {
        id: 'mat_1',
        identifier: 'content-material',
        title: 'Content Material',
        type: 'CONTENT',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
      {
        id: 'mat_2',
        identifier: 'slide-material',
        title: 'Slide Material',
        type: 'SLIDE_CONTROL',
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
      },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.materials).toHaveLength(2);
    expect(json.materials[0]).toHaveProperty('type');
    expect(json.materials[0].type).toBe('CONTENT');
    expect(json.materials[1].type).toBe('SLIDE_CONTROL');
  });
});

describe('026: GET /api/admin/course-material/[id] — type + blob fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes type, blobUrl, blobPathname in single material response', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_1',
      identifier: 'test-material',
      title: 'Test Material',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/test.html',
      blobPathname: 'course-material/slides/test.html',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_1'
    );
    const response = await GET_SINGLE(request, {
      params: createParams('mat_1'),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.type).toBe('SLIDE_CONTROL');
    expect(json.blobUrl).toBe(
      'https://blob.vercel-storage.com/course-material/slides/test.html'
    );
    expect(json.blobPathname).toBe('course-material/slides/test.html');
  });
});

// ─── 026: T007 — POST FormData creates SLIDE_CONTROL ────────────────────────

describe('026: POST /api/admin/course-material — FormData SLIDE_CONTROL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates SLIDE_CONTROL material from FormData with .html file', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null); // identifier not taken
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/slides/slide-deck.html',
      pathname: 'course-material/slides/slide-deck.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_sc_1',
      identifier: 'slide-deck',
      title: 'Slide Deck',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/slide-deck.html',
      blobPathname: 'course-material/slides/slide-deck.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fileContent =
      '<html><body><div class="reveal">slides</div></body></html>';
    const file = new File([fileContent], 'presentation.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('title', 'Slide Deck');
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.type).toBe('SLIDE_CONTROL');
    expect(json.identifier).toBe('slide-deck');
    expect(mockPut).toHaveBeenCalledWith(
      'course-material/slides/slide-deck.html',
      expect.any(String),
      expect.objectContaining({ access: 'public', contentType: 'text/html' })
    );
  });

  it('returns 400 for .txt file upload', async () => {
    mockAuthenticatedAdmin();

    const file = new File(['plain text'], 'notes.txt', {
      type: 'text/plain',
    });
    const formData = new FormData();
    formData.append('title', 'Bad Upload');
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
    expect(json.message).toContain('.html');
  });

  it('returns 400 for file exceeding 20 MB', async () => {
    mockAuthenticatedAdmin();

    // Create a file with actual content exceeding 20 MB
    // Note: Object.defineProperty(file, 'size') does not work because NextRequest
    // reconstructs the File from serialized data, losing the stubbed property.
    const oversizedContent = new Uint8Array(20_971_521);
    const file = new File([oversizedContent], 'huge.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('title', 'Huge File');
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('validation_error');
  });

  it('stores SLIDE_CONTROL file content as-is without sanitization', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/slides/raw-slides.html',
      pathname: 'course-material/slides/raw-slides.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_raw',
      identifier: 'raw-slides',
      title: 'Raw Slides',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/raw-slides.html',
      blobPathname: 'course-material/slides/raw-slides.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Content that would be modified by sanitizeHtml — script tags, onclick handlers
    const rawHtml =
      '<html><head><script>Reveal.initialize();</script></head><body onclick="next()"><section>Slide 1</section></body></html>';
    const file = new File([rawHtml], 'raw-slides.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('title', 'Raw Slides');
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);

    expect(response.status).toBe(201);
    // The blob put should receive UNSANITIZED content
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('raw-slides.html'),
      rawHtml,
      expect.any(Object)
    );
  });
});

// ─── 026: T008 — POST FormData identifier handling ──────────────────────────

describe('026: POST /api/admin/course-material — FormData identifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-generates slug from title when no identifier provided', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue(null);
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/slides/meine-praesentation.html',
      pathname: 'course-material/slides/meine-praesentation.html',
    });
    mockPrisma.courseMaterial.create.mockResolvedValue({
      id: 'mat_auto',
      identifier: 'meine-praesentation',
      title: 'Meine Präsentation',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/meine-praesentation.html',
      blobPathname: 'course-material/slides/meine-praesentation.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = new File(['<html></html>'], 'file.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('title', 'Meine Präsentation');
    formData.append('file', file);
    // No identifier field

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.identifier).toBe('meine-praesentation');
  });

  it('returns 409 for FormData with taken identifier', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'existing',
      identifier: 'taken-id',
    });

    const file = new File(['<html></html>'], 'deck.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('title', 'Deck');
    formData.append('identifier', 'taken-id');
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material',
      { method: 'POST', body: formData }
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('conflict');
  });
});

// ─── 026: T009 — PUT FormData + type mismatch ──────────────────────────────

describe('026: PUT /api/admin/course-material/[id] — FormData + type mismatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces blob when FormData sent for SLIDE_CONTROL material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_sc_1',
      identifier: 'my-slides',
      title: 'My Slides',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/my-slides.html',
      blobPathname: 'course-material/slides/my-slides.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDel.mockResolvedValue(undefined);
    // Return a different URL to simulate identifier change triggering old blob deletion
    mockPut.mockResolvedValue({
      url: 'https://blob.vercel-storage.com/course-material/slides/new-slides.html',
      pathname: 'course-material/slides/new-slides.html',
    });
    mockPrisma.courseMaterial.update.mockResolvedValue({
      id: 'mat_sc_1',
      identifier: 'new-slides',
      title: 'My Slides',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/new-slides.html',
      blobPathname: 'course-material/slides/new-slides.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = new File(['<html>updated slides</html>'], 'new-slides.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identifier', 'new-slides');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_sc_1',
      { method: 'PUT', body: formData }
    );
    const response = await PUT(request, {
      params: createParams('mat_sc_1'),
    });

    expect(response.status).toBe(200);
    expect(mockDel).toHaveBeenCalledWith(
      'https://blob.vercel-storage.com/course-material/slides/my-slides.html'
    ); // old blob deleted (URL changed due to identifier change)
    expect(mockPut).toHaveBeenCalled(); // new blob uploaded
  });

  it('allows metadata-only FormData update without file', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_sc_2',
      identifier: 'slides-2',
      title: 'Old Title',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/slides-2.html',
      blobPathname: 'course-material/slides/slides-2.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.courseMaterial.update.mockResolvedValue({
      id: 'mat_sc_2',
      identifier: 'slides-2',
      title: 'New Title',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/slides-2.html',
      blobPathname: 'course-material/slides/slides-2.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.append('title', 'New Title');

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_sc_2',
      { method: 'PUT', body: formData }
    );
    const response = await PUT(request, {
      params: createParams('mat_sc_2'),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.title).toBe('New Title');
    expect(mockPut).not.toHaveBeenCalled(); // no blob upload
  });

  it('returns 400 when JSON+htmlContent sent for SLIDE_CONTROL material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_sc_3',
      identifier: 'slides-3',
      title: 'Slides 3',
      type: 'SLIDE_CONTROL',
      blobUrl:
        'https://blob.vercel-storage.com/course-material/slides/slides-3.html',
      blobPathname: 'course-material/slides/slides-3.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_sc_3',
      {
        method: 'PUT',
        body: JSON.stringify({ htmlContent: '<p>Should fail</p>' }),
      }
    );
    const response = await PUT(request, {
      params: createParams('mat_sc_3'),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('type_mismatch');
    expect(json.message).toContain('Materialtyp');
  });

  it('returns 400 when FormData sent for CONTENT material', async () => {
    mockAuthenticatedAdmin();
    mockPrisma.courseMaterial.findUnique.mockResolvedValue({
      id: 'mat_c_1',
      identifier: 'content-1',
      title: 'Content 1',
      type: 'CONTENT',
      blobUrl: 'https://blob.vercel-storage.com/course-material/content-1.html',
      blobPathname: 'course-material/content-1.html',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const file = new File(['<html>wrong</html>'], 'wrong.html', {
      type: 'text/html',
    });
    const formData = new FormData();
    formData.append('file', file);

    const request = new NextRequest(
      'http://localhost/api/admin/course-material/mat_c_1',
      { method: 'PUT', body: formData }
    );
    const response = await PUT(request, {
      params: createParams('mat_c_1'),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('type_mismatch');
    expect(json.message).toContain('Materialtyp');
  });
});
