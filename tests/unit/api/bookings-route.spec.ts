import { beforeEach, describe, expect, it, jest } from '@/tests/vitest/jest-globals';
import { NextRequest } from 'next/server';

const mockGetCurrentUser = vi.fn();
const mockSyncUserFromClerk = vi.fn();
const mockLogError = vi.fn();
const mockReportError = vi.fn();

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  booking: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  course: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/api/users', () => ({
  syncUserFromClerk: (user: unknown) => mockSyncUserFromClerk(user),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/errors', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

vi.mock('@/lib/monitoring/rollbar-official', () => ({
  ErrorSeverity: {
    ERROR: 'error',
    WARNING: 'warning',
  },
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

vi.mock('@/lib/utils/clerk-disabled-check', () => ({
  isClerkDisabled: () => false,
}));

describe('GET /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to an existing DB user after a recoverable Clerk sync failure', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user_clerk_123',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    });
    mockSyncUserFromClerk.mockRejectedValue(new Error('sync failed'));
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_clerk_123',
    });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.booking.count.mockResolvedValue(0);

    const { GET } = await import('@/app/api/bookings/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/bookings?limit=100')
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'user_clerk_123',
      },
      select: { id: true },
    });
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user_clerk_123',
        },
      })
    );
    expect(json).toEqual({
      success: true,
      data: {
        bookings: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          pages: 0,
        },
      },
    });
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        additionalData: expect.objectContaining({
          clerkUserId: 'user_clerk_123',
          hasEmail: true,
        }),
      }),
      'warning'
    );
    expect(mockReportError).not.toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        additionalData: expect.objectContaining({ email: 'user@example.com' }),
      }),
      expect.anything()
    );
  });

  it('does not recover bookings by email when the Clerk ID is missing', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user_clerk_123',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    });
    mockSyncUserFromClerk.mockRejectedValue(new Error('sync failed'));
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'legacy-user-123' });

    const { GET } = await import('@/app/api/bookings/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/bookings?limit=100')
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ success: false, error: 'Internal error' });
    expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'user_clerk_123' },
      select: { id: true },
    });
    expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: 'user@example.com' },
      select: { id: true },
    });
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        additionalData: expect.objectContaining({
          clerkUserId: 'user_clerk_123',
          hasEmail: true,
          matchedUserId: 'legacy-user-123',
        }),
      }),
      'warning'
    );
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'api/bookings#get',
      })
    );
  });

  it('creates bookings with the resolved fallback user id in POST flows', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user_clerk_123',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    });
    mockSyncUserFromClerk.mockRejectedValue(new Error('sync failed'));
    mockPrisma.course.findUnique.mockResolvedValue({
      id: 'course-123',
      isPublished: true,
      price: 49900,
      currency: 'EUR',
    });
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'legacy-user-123',
    });
    mockPrisma.booking.findFirst.mockResolvedValue(null);
    mockPrisma.booking.create.mockResolvedValue({
      id: 'booking-123',
      courseId: 'course-123',
      paymentStatus: 'PENDING',
      createdAt: new Date('2026-05-09T12:00:00.000Z'),
      course: {
        title: 'Grundkurs',
        price: 49900,
      },
    });

    const { POST } = await import('@/app/api/bookings/route');
    const response = await POST(
      new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId: 'course-123' }),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'legacy-user-123',
        courseId: 'course-123',
      },
    });
    expect(mockPrisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'legacy-user-123',
          courseId: 'course-123',
        }),
      })
    );
    expect(json).toEqual({
      success: true,
      data: {
        booking: {
          id: 'booking-123',
          courseId: 'course-123',
          courseTitle: 'Grundkurs',
          price: 49900,
          paymentStatus: 'PENDING',
          createdAt: '2026-05-09T12:00:00.000Z',
        },
      },
    });
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        additionalData: expect.objectContaining({
          clerkUserId: 'user_clerk_123',
          hasEmail: true,
        }),
      }),
      'warning'
    );
  });
});