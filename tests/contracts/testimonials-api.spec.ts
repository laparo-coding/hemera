/**
 * Testimonial API Contract Tests
 * Feature: 017-testimonial-management
 *
 * Contract tests for testimonial API endpoints
 */

// Mock Prisma
const mockPrisma = {
  booking: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  testimonial: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock Clerk auth
const mockAuth = vi.fn();
const mockCurrentUser = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

// Mock testimonial service
const mockGetTestimonialsByUserId = vi.fn();
const mockCreateTestimonial = vi.fn();
vi.mock('@/lib/services/testimonial', () => ({
  getTestimonialsByUserId: (userId: string) =>
    mockGetTestimonialsByUserId(userId),
  createTestimonial: (input: unknown, profile: unknown) =>
    mockCreateTestimonial(input, profile),
  toTestimonialWithCourseApiResponse: vi.fn(t => t),
  toTestimonialApiResponse: vi.fn(t => t),
}));

vi.mock('@/lib/types/testimonial', () => ({
  toTestimonialWithCourseApiResponse: vi.fn(t => t),
  toTestimonialApiResponse: vi.fn(t => t),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/testimonials/route';

describe('GET /api/testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/testimonials');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns user testimonials for authenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockGetTestimonialsByUserId.mockResolvedValue([
      {
        id: 'testimonial_1',
        statement: 'Great course!',
        status: 'PUBLISHED',
        course: { id: 'course_1', title: 'Test Course', slug: 'test-course' },
      },
    ]);

    const request = new NextRequest('http://localhost/api/testimonials');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(mockGetTestimonialsByUserId).toHaveBeenCalledWith('user_123');
  });

  it('returns empty array when user has no testimonials', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockGetTestimonialsByUserId.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/testimonials');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });
});

describe('POST /api/testimonials', () => {
  const validBody = {
    bookingId: 'booking_123',
    statement: 'This was an amazing course! I learned so much.',
    nameDisplayFormat: 'FULL_NAME',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const request = new NextRequest('http://localhost/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid bookingId', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
      imageUrl: null,
      publicMetadata: {},
    });

    const request = new NextRequest('http://localhost/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        bookingId: 'invalid', // Not a valid cuid
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for statement exceeding 1000 chars', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
    });

    const longStatement = 'a'.repeat(1001);

    const request = new NextRequest('http://localhost/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        statement: longStatement,
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 400 for invalid nameDisplayFormat', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      firstName: 'Max',
      lastName: 'Mustermann',
    });

    const request = new NextRequest('http://localhost/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        nameDisplayFormat: 'INVALID_FORMAT',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
