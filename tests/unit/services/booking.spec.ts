import { beforeEach, describe, expect, it } from '@/tests/vitest/jest-globals';
import { PaymentStatus } from '@prisma/client';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    course: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

import { createBooking } from '../../../lib/services/booking';

describe('Booking service regression coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.booking.findUnique.mockResolvedValue(null);
    mockPrisma.course.findUnique.mockResolvedValue({
      id: 'course_123',
      isPublished: true,
      bookings: [],
      capacity: null,
    });
    mockPrisma.booking.upsert.mockResolvedValue({
      id: 'booking_123',
      userId: 'user_123',
      courseId: 'course_123',
      paymentStatus: PaymentStatus.PENDING,
      amount: 19900,
      currency: 'EUR',
    });
  });

  it('defaults the booking currency to EUR when no currency is provided', async () => {
    await createBooking({
      userId: 'user_123',
      courseId: 'course_123',
      amount: 19900,
    });

    expect(mockPrisma.booking.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currency: 'EUR',
        }),
      })
    );
  });
});