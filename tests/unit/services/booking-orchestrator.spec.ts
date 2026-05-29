/**
 * Unit Tests: Booking Orchestrator
 * Feature: 021-learning-path
 *
 * Tests the booking orchestrator that coordinates prerequisite checking,
 * PRE_BOOKED creation, and admin notifications.
 */

import { beforeEach, describe, expect, it, jest } from '@/tests/vitest/jest-globals';
import { PaymentStatus } from '@prisma/client';
import { createBooking } from '../../../lib/services/booking';
import {
  createPreBookedWithNotification,
  handleBookingWithPrerequisites,
} from '../../../lib/services/booking-orchestrator';
import {
  getAdminEmails,
  isLoopsConfigured,
  isValidEmail,
  sendPrerequisiteReviewEmail,
} from '../../../lib/services/loops';
import { checkPrerequisite } from '../../../lib/services/prerequisite';

// Mock dependencies
vi.mock('../../../lib/services/prerequisite');
vi.mock('../../../lib/services/booking');
vi.mock('../../../lib/services/loops', () => ({
  getAdminEmails: vi.fn(),
  isLoopsConfigured: vi.fn(),
  isValidEmail: vi.fn(),
  sendPrerequisiteReviewEmail: vi.fn(),
}));
vi.mock('../../../lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const mockCheckPrerequisite = checkPrerequisite as jest.MockedFunction<
  typeof checkPrerequisite
>;
const mockCreateBooking = createBooking as jest.MockedFunction<
  typeof createBooking
>;
const mockGetAdminEmails = getAdminEmails as jest.MockedFunction<
  typeof getAdminEmails
>;
const mockIsValidEmail = isValidEmail as jest.MockedFunction<
  typeof isValidEmail
>;
const mockSendEmail = sendPrerequisiteReviewEmail as jest.MockedFunction<
  typeof sendPrerequisiteReviewEmail
>;

describe('Booking Orchestrator', () => {
  const testUser = {
    id: 'user_test123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const testCourse = {
    id: 'course_test123',
    title: 'Test Intermediate Course',
    level: 'INTERMEDIATE' as const,
    price: 9999,
    currency: 'EUR',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock isLoopsConfigured to return true by default
    (
      isLoopsConfigured as jest.MockedFunction<typeof isLoopsConfigured>
    ).mockReturnValue(true);
    // Mock isValidEmail to simulate real email validation
    mockIsValidEmail.mockImplementation(email => {
      if (!email || typeof email !== 'string') return false;
      const trimmed = email.trim();
      if (trimmed.length === 0) return false;

      const parts = trimmed.split('@');
      if (parts.length !== 2) return false;

      const [local, domain] = parts;
      if (!local || !domain) return false;
      return local.length > 0 && domain.includes('.') && domain.length > 3;
    });
  });

  describe('handleBookingWithPrerequisites', () => {
    it('should return error when course.level is missing', async () => {
      // Arrange
      const courseWithoutLevel = { ...testCourse, level: null as any };

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: courseWithoutLevel as any,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('unvollständig');
    });

    it('should create PRE_BOOKED when user is not qualified', async () => {
      // Arrange: User lacks prerequisites
      mockCheckPrerequisite.mockResolvedValue({
        qualified: false,
        missingLevel: 'BEGINNER',
        completedCourses: [],
      });

      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockResolvedValue({ success: true });

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.requiresReview).toBe(true);
      expect(result.bookingId).toBe('booking_new123');
      expect(result.missingPrerequisite).toBe('BEGINNER');
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PRE_BOOKED,
        })
      );
    });

    it('should return success without PRE_BOOKED when user is qualified', async () => {
      // Arrange: User has prerequisites
      mockCheckPrerequisite.mockResolvedValue({
        qualified: true,
        missingLevel: null,
        completedCourses: [
          {
            courseId: 'course_beginner',
            courseTitle: 'Beginner Course',
            level: 'BEGINNER',
            completedAt: new Date(),
          },
        ],
      });

      mockCreateBooking.mockResolvedValue({
        id: 'booking_pending',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.requiresReview).toBe(false);
      expect(result.bookingId).toBe('booking_pending');
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PENDING,
        })
      );
    });

    it('should skip prerequisite check for BEGINNER courses and create booking', async () => {
      // Arrange
      const beginnerCourse = { ...testCourse, level: 'BEGINNER' as const };

      mockCreateBooking.mockResolvedValue({
        id: 'booking_beginner',
        userId: testUser.id,
        courseId: beginnerCourse.id,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: beginnerCourse as any,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.requiresReview).toBe(false);
      expect(result.bookingId).toBe('booking_beginner');
      expect(mockCheckPrerequisite).not.toHaveBeenCalled(); // Prerequisite check skipped
      expect(mockCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PaymentStatus.PENDING,
          courseId: beginnerCourse.id,
        })
      );
    });
  });

  describe('createPreBookedWithNotification', () => {
    it('should create PRE_BOOKED booking and send admin notification', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue([
        'admin1@example.com',
        'admin2@example.com',
      ]);
      mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg_123' });

      // Act
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.requiresReview).toBe(true);
      expect(result.bookingId).toBe('booking_new123');
      expect(result.missingPrerequisite).toBe('BEGINNER');
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerEmail: testUser.email,
          courseName: testCourse.title,
          courseLevel: testCourse.level,
          missingPrerequisite: 'BEGINNER',
          bookingId: 'booking_new123',
          adminEmails: ['admin1@example.com', 'admin2@example.com'],
        })
      );
    });

    it('should succeed even if email notification fails', async () => {
      // Arrange: Booking succeeds but email fails
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockRejectedValue(new Error('Email service unavailable'));

      // Act
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert: Booking should still succeed
      expect(result.success).toBe(true);
      expect(result.requiresReview).toBe(true);
      expect(result.bookingId).toBe('booking_new123');
    });

    it('should return error when booking creation fails', async () => {
      // Arrange
      mockCreateBooking.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('konnte nicht erstellt werden');
    });

    it('should skip email when user has no email address', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);

      // Act: User without email
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: null,
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should skip email when no admin emails are available', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue([]); // No admins

      // Act
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should extract first name from full name', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockResolvedValue({ success: true });

      // Act
      await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: 'John Doe Smith',
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'John',
        })
      );
    });

    it('should use fallback name when userName is null', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockResolvedValue({ success: true });

      // Act
      await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: null,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Teilnehmer',
        })
      );
    });
  });

  describe('Email Notification Edge Cases', () => {
    it('should handle empty string email gracefully', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);

      // Act
      const result = await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: '  ', // Empty/whitespace string
          userName: testUser.name,
          course: testCourse as any,
        },
        'BEGINNER'
      );

      // Assert: Should succeed without sending email
      expect(result.success).toBe(true);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should skip email when email format is invalid', async () => {
      // Arrange
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: testCourse.price,
        currency: testCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);

      // Act: Invalid email formats
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        'invalid@',
        '@nodomain.com',
      ];

      for (const invalidEmail of invalidEmails) {
        mockSendEmail.mockClear();
        mockCreateBooking.mockClear();
        mockCreateBooking.mockResolvedValue({
          id: 'booking_new123',
          userId: testUser.id,
          courseId: testCourse.id,
          paymentStatus: PaymentStatus.PRE_BOOKED,
          amount: testCourse.price,
          currency: testCourse.currency,
        } as any);

        const result = await createPreBookedWithNotification(
          {
            userId: testUser.id,
            userEmail: invalidEmail,
            userName: testUser.name,
            course: testCourse as any,
          },
          'BEGINNER'
        );

        // Assert: Should succeed but skip email
        expect(result.success).toBe(true);
        expect(mockSendEmail).not.toHaveBeenCalled();
      }
    });

    it('should handle ADVANCED course level correctly', async () => {
      // Arrange
      const advancedCourse = { ...testCourse, level: 'ADVANCED' as const };
      mockCreateBooking.mockResolvedValue({
        id: 'booking_new123',
        userId: testUser.id,
        courseId: advancedCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: advancedCourse.price,
        currency: advancedCourse.currency,
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockResolvedValue({ success: true });

      // Act
      await createPreBookedWithNotification(
        {
          userId: testUser.id,
          userEmail: testUser.email,
          userName: testUser.name,
          course: advancedCourse as any,
        },
        'INTERMEDIATE'
      );

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          courseLevel: 'ADVANCED',
          missingPrerequisite: 'INTERMEDIATE',
        })
      );
    });
  });

  describe('Orchestrator Error Handling', () => {
    it('should return generic error when PRE_BOOKED booking fails due to duplicate', async () => {
      // Arrange: createBooking throws duplicate error for PRE_BOOKED
      mockCheckPrerequisite.mockResolvedValue({
        qualified: false,
        missingLevel: 'BEGINNER',
        completedCourses: [],
      });

      mockCreateBooking.mockRejectedValue(
        new Error('Deine Buchung wird gerade geprüft')
      );

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert: PRE_BOOKED errors return generic message (security)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Buchung konnte nicht erstellt werden');
    });

    it('should return user-friendly error for qualified booking duplicates', async () => {
      // Arrange: User is qualified, but duplicate booking exists
      mockCheckPrerequisite.mockResolvedValue({
        qualified: true,
        missingLevel: null,
        completedCourses: [
          {
            courseId: 'course_beginner',
            courseTitle: 'Beginner Course',
            level: 'BEGINNER',
            completedAt: new Date(),
          },
        ],
      });

      mockCreateBooking.mockRejectedValue(
        new Error('Du hast diesen Kurs bereits gebucht (Status: PENDING)')
      );

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert: Qualified booking errors preserve specific message
      expect(result.success).toBe(false);
      expect(result.error).toContain('bereits gebucht');
    });

    it('should handle BEGINNER booking creation failure', async () => {
      // Arrange
      const beginnerCourse = { ...testCourse, level: 'BEGINNER' as const };
      mockCreateBooking.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: beginnerCourse as any,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Buchung konnte nicht erstellt werden');
    });

    it('should preserve user-friendly error messages from booking service', async () => {
      // Arrange
      const beginnerCourse = { ...testCourse, level: 'BEGINNER' as const };
      mockCreateBooking.mockRejectedValue(
        new Error('Du hast diesen Kurs bereits gebucht (Status: PAID)')
      );

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: beginnerCourse as any,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('bereits gebucht');
    });
  });

  describe('Type Safety and Discriminated Union', () => {
    it('should have correct type structure for success without review', async () => {
      // Arrange
      mockCheckPrerequisite.mockResolvedValue({
        qualified: true,
        missingLevel: null,
        completedCourses: [],
      });

      mockCreateBooking.mockResolvedValue({
        id: 'booking_qualified',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PENDING,
        amount: 9999,
        currency: 'EUR',
      } as any);

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert: Type-safe discriminated union
      expect(result.success).toBe(true);
      if (result.success && !result.requiresReview) {
        expect(result.bookingId).toBeDefined();
        expect(result.message).toBeUndefined();
        expect(result.missingPrerequisite).toBeUndefined();
        expect(result.error).toBeUndefined();
      }
    });

    it('should have correct type structure for success with review', async () => {
      // Arrange
      mockCheckPrerequisite.mockResolvedValue({
        qualified: false,
        missingLevel: 'BEGINNER',
        completedCourses: [],
      });

      mockCreateBooking.mockResolvedValue({
        id: 'booking_pre_booked',
        userId: testUser.id,
        courseId: testCourse.id,
        paymentStatus: PaymentStatus.PRE_BOOKED,
        amount: 9999,
        currency: 'EUR',
      } as any);

      mockGetAdminEmails.mockResolvedValue(['admin@example.com']);
      mockSendEmail.mockResolvedValue({ success: true });

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: testCourse as any,
      });

      // Assert: Type-safe discriminated union
      expect(result.success).toBe(true);
      if (result.success && result.requiresReview) {
        expect(result.bookingId).toBeDefined();
        expect(result.message).toBeDefined();
        expect(result.missingPrerequisite).toBeDefined();
        expect(result.error).toBeUndefined();
      }
    });

    it('should have correct type structure for error', async () => {
      // Arrange
      const courseWithoutLevel = { ...testCourse, level: null as any };

      // Act
      const result = await handleBookingWithPrerequisites({
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name,
        course: courseWithoutLevel as any,
      });

      // Assert: Type-safe discriminated union
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.bookingId).toBeUndefined();
        expect(result.requiresReview).toBeUndefined();
        expect(result.message).toBeUndefined();
        expect(result.missingPrerequisite).toBeUndefined();
      }
    });
  });
});
