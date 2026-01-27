/**
 * Unit Tests: Booking Status Transitions and PRE_BOOKED Logic
 * Feature: 021-learning-path
 *
 * Tests the transition rules added to createBooking to prevent
 * multiple PRE_BOOKED entries and enforce valid status transitions.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../../../lib/db/prisma';
import { createBooking } from '../../../lib/services/booking';

// Mock Prisma
jest.mock('../../../lib/db/prisma', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Booking Status Transitions', () => {
  const testUserId = 'user_test123';
  const testCourseId = 'course_test123';
  const testCourse = {
    id: testCourseId,
    title: 'Test Course',
    price: 9999,
    currency: 'EUR',
    isPublished: true,
    capacity: 20,
    bookings: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: Course exists and is published
    mockPrisma.course.findUnique.mockResolvedValue(testCourse as any);
  });

  describe('PRE_BOOKED Creation Rules', () => {
    it('should create PRE_BOOKED booking when no existing booking exists', async () => {
      // Arrange: No existing booking
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      const result = await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PRE_BOOKED,
      });

      // Assert
      expect(result.paymentStatus).toBe(PaymentStatus.PRE_BOOKED);
      expect(mockPrisma.booking.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            paymentStatus: PaymentStatus.PRE_BOOKED,
          }),
        })
      );
    });

    it('should reject PRE_BOOKED creation when PENDING booking exists', async () => {
      // Arrange: Existing PENDING booking
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_existing',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act & Assert
      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/bereits gebucht.*PENDING/);
    });

    it('should reject PRE_BOOKED creation when another PRE_BOOKED exists', async () => {
      // Arrange: Existing PRE_BOOKED booking (duplicate attempt)
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_existing',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act & Assert
      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/wird gerade geprüft/);
    });

    it('should reject PRE_BOOKED creation when PAID booking exists', async () => {
      // Arrange: Existing PAID booking (user already enrolled)
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_existing',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PAID,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act & Assert
      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/bereits gebucht.*PAID/);
    });

    it('should allow PRE_BOOKED creation when CANCELLED booking exists', async () => {
      // Arrange: Existing CANCELLED booking (can be re-attempted)
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_cancelled',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.CANCELLED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      const result = await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PRE_BOOKED,
      });

      // Assert
      expect(result.paymentStatus).toBe(PaymentStatus.PRE_BOOKED);
    });
  });

  describe('Status Transition Logic', () => {
    it('should NOT transition CANCELLED to PENDING when creating PRE_BOOKED', async () => {
      // Arrange: Existing CANCELLED booking
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_cancelled',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.CANCELLED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PRE_BOOKED,
      });

      // Assert: update should NOT set paymentStatus to PENDING
      const upsertCall = mockPrisma.booking.upsert.mock.calls[0]?.[0];
      expect(upsertCall?.update).not.toHaveProperty(
        'paymentStatus',
        PaymentStatus.PENDING
      );
    });

    it('should transition CANCELLED to PENDING for normal booking', async () => {
      // Arrange: Existing CANCELLED booking
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_cancelled',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.CANCELLED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_updated',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act: Create normal booking (no initial status = PENDING)
      await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
      });

      // Assert: update should include paymentStatus transition
      const upsertCall = mockPrisma.booking.upsert.mock.calls[0]?.[0];
      expect(upsertCall?.update).toEqual(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PENDING,
        })
      );
    });
  });

  describe('Initial Status Parameter', () => {
    it('should create booking with PRE_BOOKED when explicitly specified', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PRE_BOOKED,
      });

      const createData = mockPrisma.booking.upsert.mock.calls[0]?.[0]?.create;
      expect(createData).toHaveProperty(
        'paymentStatus',
        PaymentStatus.PRE_BOOKED
      );
    });

    it('should default to PENDING when no initial status specified', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
      });

      const createData = mockPrisma.booking.upsert.mock.calls[0]?.[0]?.create;
      expect(createData).toHaveProperty('paymentStatus', PaymentStatus.PENDING);
    });

    it('should respect custom initial status (e.g., CONFIRMED)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      mockPrisma.booking.upsert.mockResolvedValue({
        id: 'booking_new',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.CONFIRMED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await createBooking({
        userId: testUserId,
        courseId: testCourseId,
        amount: 9999,
        currency: 'EUR',
        paymentStatus: PaymentStatus.CONFIRMED,
      });

      const createData = mockPrisma.booking.upsert.mock.calls[0]?.[0]?.create;
      expect(createData).toHaveProperty(
        'paymentStatus',
        PaymentStatus.CONFIRMED
      );
    });
  });

  describe('Edge Cases', () => {
    it('should reject PRE_BOOKED when FAILED booking exists', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_failed',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.FAILED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/gebucht/);
    });

    it('should reject PRE_BOOKED when REFUNDED booking exists', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_refunded',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.REFUNDED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/gebucht/);
    });

    it('should reject PRE_BOOKED when CONFIRMED booking exists', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_confirmed',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.CONFIRMED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/gebucht/);
    });

    it('should reject PENDING creation when PRE_BOOKED exists', async () => {
      // Prevent normal checkout while admin review is pending
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_pre_booked',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          // No paymentStatus = defaults to PENDING
        })
      ).rejects.toThrow(/wird gerade geprüft/);
    });

    it('should reject PENDING creation when another PENDING exists', async () => {
      // Prevent duplicate checkout sessions
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_pending',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
        })
      ).rejects.toThrow(/bereits gebucht/);
    });

    it('should reject any booking creation when PAID exists', async () => {
      // User already enrolled - cannot create any new booking
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking_paid',
        userId: testUserId,
        courseId: testCourseId,
        paymentStatus: PaymentStatus.PAID,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Try PRE_BOOKED
      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      ).rejects.toThrow(/bereits gebucht/);

      // Try PENDING
      await expect(
        createBooking({
          userId: testUserId,
          courseId: testCourseId,
          amount: 9999,
          currency: 'EUR',
        })
      ).rejects.toThrow(/bereits gebucht/);
    });
  });
});
