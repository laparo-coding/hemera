/**
 * Testimonial API Unit Tests
 * Feature: 017-testimonial-management
 *
 * Tests for GET/POST /api/courses/[id]/testimonials
 */

// Mock Prisma
const mockPrisma = {
  course: {
    findFirst: jest.fn(),
  },
  testimonial: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  courseParticipation: {
    findFirst: jest.fn(),
  },
};

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Clerk
const mockCurrentUser = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => mockCurrentUser(),
}));

// Mock syncUserFromClerk
const mockSyncUserFromClerk = jest.fn();
jest.mock('@/lib/api/users', () => ({
  syncUserFromClerk: (user: unknown) => mockSyncUserFromClerk(user),
}));

// Mock testimonial service for POST tests
const mockCreateTestimonial = jest.fn();
const mockGetPublishedTestimonialsForCourse = jest.fn();
jest.mock('@/lib/services/testimonial', () => ({
  createTestimonial: (data: unknown) => mockCreateTestimonial(data),
  getPublishedTestimonialsForCourse: (courseId: string, limit: number) =>
    mockGetPublishedTestimonialsForCourse(courseId, limit),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/courses/[id]/testimonials/route';

// POST is not yet implemented - placeholder for skipped tests
// biome-ignore lint/suspicious/noExplicitAny: placeholder for future implementation
const POST: any = undefined;

describe('GET /api/courses/[id]/testimonials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 for empty course ID (course not found)', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/courses//testimonials'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: '' }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('NOT_FOUND');
  });

  it('returns 404 for whitespace-only course ID (course not found)', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/courses/   /testimonials'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: '   ' }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('returns 404 when course not found', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/courses/invalid-id/testimonials'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid limit parameter (NaN)', async () => {
    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials?limit=abc'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for negative limit parameter', async () => {
    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials?limit=-5'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for zero limit parameter', async () => {
    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials?limit=0'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('caps limit at 50', async () => {
    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });
    mockGetPublishedTestimonialsForCourse.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials?limit=100'
    );

    await GET(request, { params: Promise.resolve({ id: 'course-123' }) });

    expect(mockGetPublishedTestimonialsForCourse).toHaveBeenCalledWith(
      'course-123',
      50
    );
  });

  it('returns published testimonials successfully', async () => {
    const mockTestimonials = [
      {
        id: 'test-1',
        courseId: 'course-123',
        userId: 'user-1',
        authorName: 'Max Mustermann',
        authorRole: 'Entwickler',
        authorImage: null,
        content: 'Toller Kurs!',
        rating: 5,
        isPublished: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
    ];

    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });
    mockGetPublishedTestimonialsForCourse.mockResolvedValue(mockTestimonials);

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials'
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].authorName).toBe('Max Mustermann');
  });

  it('finds course by slug', async () => {
    mockPrisma.course.findFirst.mockResolvedValue({ id: 'course-123' });
    mockPrisma.testimonial.findMany.mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost/api/courses/my-course-slug/testimonials'
    );

    await GET(request, { params: Promise.resolve({ id: 'my-course-slug' }) });

    expect(mockPrisma.course.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: 'my-course-slug' }, { slug: 'my-course-slug' }],
        isNonPublic: false,
        isPublished: true,
      },
      select: { id: true },
    });
  });
});

// TODO: POST route not yet implemented (Feature 017-testimonial-management pending)
// Re-enable when POST export is added to app/api/courses/[id]/testimonials/route.ts
describe.skip('POST /api/courses/[id]/testimonials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Great course!', rating: 5 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for empty course ID', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user_123' });

    const request = new NextRequest(
      'http://localhost/api/courses//testimonials',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Great course!', rating: 5 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: '' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 404 when course not found', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/courses/invalid-id/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Great course!', rating: 5 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('NOT_FOUND');
  });

  it('returns 400 for content too short', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({ content: 'Kurz', rating: 5 }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
    expect(json.error?.message).toContain('10 Zeichen');
  });

  it('returns 400 for invalid rating (too low)', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 0,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for invalid rating (too high)', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 6,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for non-numeric rating', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 'excellent',
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('INVALID_INPUT');
  });

  it('returns 409 when user already submitted a testimonial', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });
    // Mock createTestimonial to throw conflict error
    mockCreateTestimonial.mockRejectedValue(
      new Error(
        'Du hast bereits einen Erfahrungsbericht für diesen Kurs eingereicht'
      )
    );

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 5,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('CONFLICT');
    expect(json.error?.message).toContain('bereits');
  });

  it('returns 403 when user has not completed the course', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });
    // Mock createTestimonial to throw not-completed error
    mockCreateTestimonial.mockRejectedValue(
      new Error(
        'Kurs nicht abgeschlossen - Erfahrungsbericht erfordert Kursabschluss'
      )
    );

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 5,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('FORBIDDEN');
  });

  it('creates testimonial successfully', async () => {
    const mockCreatedTestimonial = {
      id: 'new-testimonial-id',
      courseId: 'course-123',
      userId: 'user_123',
      authorName: 'Max Mustermann',
      authorRole: null,
      authorImage: 'https://example.com/avatar.jpg',
      content: 'Toller Kurs mit viel Inhalt!',
      rating: 5,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: 'https://example.com/avatar.jpg',
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'user_123' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });
    mockCreateTestimonial.mockResolvedValue(mockCreatedTestimonial);

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 5,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: 'course-123' }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.testimonialId).toBe('new-testimonial-id');
    expect(json.data.message).toContain('eingereicht');
  });

  it('uses synced DB user ID, not Clerk ID', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'clerk_user_abc',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
    });
    mockSyncUserFromClerk.mockResolvedValue({ id: 'db_user_xyz' });
    mockPrisma.course.findFirst.mockResolvedValue({
      id: 'course-123',
      title: 'Test Kurs',
    });
    mockCreateTestimonial.mockResolvedValue({
      id: 'new-testimonial-id',
      courseId: 'course-123',
      userId: 'db_user_xyz',
      authorName: 'Max Mustermann',
      authorRole: null,
      authorImage: null,
      content: 'Toller Kurs mit viel Inhalt!',
      rating: 5,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost/api/courses/course-123/testimonials',
      {
        method: 'POST',
        body: JSON.stringify({
          content: 'Toller Kurs mit viel Inhalt!',
          rating: 5,
        }),
      }
    );

    await POST(request, { params: Promise.resolve({ id: 'course-123' }) });

    // Verify the synced user was used when calling createTestimonial
    expect(mockCreateTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'db_user_xyz', // DB user ID, not Clerk ID
        courseId: 'course-123',
      })
    );
  });
});
