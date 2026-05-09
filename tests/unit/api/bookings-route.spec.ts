import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockGetCurrentUser = jest.fn();
const mockSyncUserFromClerk = jest.fn();
const mockLogError = jest.fn();
const mockReportError = jest.fn();

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

jest.mock('@/lib/api/users', () => ({
  syncUserFromClerk: (user: unknown) => mockSyncUserFromClerk(user),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/errors', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

jest.mock('@/lib/monitoring/rollbar-official', () => ({
  ErrorSeverity: {
    WARNING: 'warning',
  },
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

jest.mock('@/lib/utils/clerk-disabled-check', () => ({
  isClerkDisabled: () => false,
}));

describe('GET /api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to an existing DB user after a recoverable Clerk sync failure', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user_clerk_123',
      primaryEmailAddress: { emailAddress: 'user@example.com' },
    });
    mockSyncUserFromClerk.mockRejectedValue(new Error('sync failed'));
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'legacy-user-123' });
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.booking.count.mockResolvedValue(0);

    const { GET } = await import('@/app/api/bookings/route');
    const response = await GET(
      new NextRequest('http://localhost:3000/api/bookings?limit=100')
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: 'user_clerk_123' }, { email: 'user@example.com' }],
      },
      select: { id: true },
    });
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'legacy-user-123',
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
    expect(mockReportError).toHaveBeenCalled();
  });
});