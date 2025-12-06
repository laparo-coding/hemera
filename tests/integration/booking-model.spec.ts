import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { PaymentStatus } from '@prisma/client';
import { prisma, closeDb } from '@/lib/db/prisma';

describe('Booking Model Validations', () => {
  let testCourse: { id: string; title: string; price: number };
  let testUser: { id: string; email: string | null };
  let testUser2: { id: string; email: string | null };

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up any existing test data first
    await prisma.booking.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Create test course with enhanced unique naming
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = `test-course-${timestamp}-${randomSuffix}`;

    // Create course directly without transaction to ensure persistence
    testCourse = await prisma.course.create({
      data: {
        id: uniqueId,
        title: `Test Course ${timestamp}`,
        description: 'Test Description',
        slug: `test-course-${timestamp}-${randomSuffix}`,
        price: 9999, // Price in cents
        currency: 'USD',
        isPublished: true,
      },
    });

    // Immediate verification with detailed error logging
    const courseExists = await prisma.course.findUnique({
      where: { id: testCourse.id },
    });

    if (!courseExists) {
      console.error('❌ COURSE CREATION FAILED');
      console.error('Expected ID:', testCourse.id);
      console.error('Course data:', testCourse);

      // List all courses for debugging
      const allCourses = await prisma.course.findMany();
      console.error(
        'All courses in DB:',
        allCourses.map(c => c.id)
      );

      throw new Error(
        `❌ Course verification failed: ${testCourse.id} not found in database`
      );
    }

    console.log('✅ Test course created and verified:', testCourse.id);

    // Create test users
    testUser = await prisma.user.create({
      data: {
        id: `test-user-${timestamp}-${randomSuffix}`,
        email: `test${timestamp}@example.com`,
        name: 'Test User',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        id: `test-user2-${timestamp}-${randomSuffix}`,
        email: `test2${timestamp}@example.com`,
        name: 'Test User 2',
      },
    });

    console.log('✅ Test users created:', testUser.id, testUser2.id);
  });

  afterEach(async () => {
    // Clean up test data in correct order with error handling
    try {
      await prisma.booking.deleteMany();
      await prisma.course.deleteMany();
      await prisma.account.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  });

  describe('Required Fields', () => {
    it('should create booking with valid required fields', async () => {
      // Enhanced verification with detailed error reporting
      const courseExists = await prisma.course.findUnique({
        where: { id: testCourse.id },
      });

      if (!courseExists) {
        console.error('❌ TEST COURSE NOT FOUND IN TEST');
        console.error('Looking for ID:', testCourse.id);

        // Debug: List all courses in database
        const allCourses = await prisma.course.findMany();
        console.error(
          'Available courses:',
          allCourses.map(c => ({ id: c.id, title: c.title }))
        );

        throw new Error(
          `❌ Test course ${testCourse.id} does not exist in database during test execution`
        );
      }

      console.log('✅ Course verification passed in test:', testCourse.id);

      const bookingData = {
        userId: testUser.id,
        courseId: testCourse.id,
        amount: testCourse.price,
        currency: 'USD',
      };

      const booking = await prisma.booking.create({
        data: bookingData,
        include: {
          course: true,
        },
      });

      expect(booking.id).toBeDefined();
      expect(booking.userId).toBe(testUser.id);
      expect(booking.courseId).toBe(testCourse.id);
      expect(booking.amount).toBe(testCourse.price);
      expect(booking.currency).toBe('USD');
      expect(booking.paymentStatus).toBe(PaymentStatus.PENDING); // default
      expect(booking.stripePaymentIntentId).toBeNull();
      expect(booking.stripeSessionId).toBeNull();
      expect(booking.createdAt).toBeInstanceOf(Date);
      expect(booking.updatedAt).toBeInstanceOf(Date);
      expect(booking.course.title).toBe(testCourse.title);
    });

    it('should require userId field', async () => {
      const bookingData = {
        courseId: testCourse.id,
        amount: 9900,
      };

      await expect(
        prisma.booking.create({
          // @ts-expect-error - intentionally missing userId
          data: bookingData,
        })
      ).rejects.toThrow();
    });

    it('should require courseId field', async () => {
      const bookingData = {
        userId: testUser.id,
        amount: 9900,
      };

      await expect(
        prisma.booking.create({
          // @ts-expect-error - intentionally missing courseId
          data: bookingData,
        })
      ).rejects.toThrow();
    });

    it('should require amount field', async () => {
      const bookingData = {
        userId: testUser.id,
        courseId: testCourse.id,
      };

      await expect(
        prisma.booking.create({
          // @ts-expect-error - intentionally missing amount
          data: bookingData,
        })
      ).rejects.toThrow();
    });

    it('should require valid courseId reference', async () => {
      const bookingData = {
        userId: testUser.id,
        courseId: 'non-existent-course-id',
        amount: 9900,
      };

      await expect(
        prisma.booking.create({
          data: bookingData,
        })
      ).rejects.toThrow(); // Foreign key constraint violation
    });
  });

  describe('Unique Constraint Validation', () => {
    it('should prevent duplicate bookings for same user and course', async () => {
      const bookingData = {
        userId: testUser.id,
        courseId: testCourse.id,
        amount: testCourse.price,
      };

      // Create first booking
      await prisma.booking.create({
        data: bookingData,
      });

      // Attempt to create duplicate booking
      await expect(
        prisma.booking.create({
          data: bookingData,
        })
      ).rejects.toThrow(); // Unique constraint violation
    });

    it('should allow same user to book different courses', async () => {
      const secondCourse = await prisma.course.create({
        data: {
          title: 'Second Test Course',
          slug: 'second-test-course',
          price: 5000,
          isPublished: true,
        },
      });

      const firstBooking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
        },
      });

      const secondBooking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: secondCourse.id,
          amount: secondCourse.price,
        },
      });

      expect(firstBooking.id).toBeDefined();
      expect(secondBooking.id).toBeDefined();
      expect(firstBooking.id).not.toBe(secondBooking.id);
    });

    it('should allow different users to book same course', async () => {
      const firstBooking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
        },
      });

      const secondBooking = await prisma.booking.create({
        data: {
          userId: testUser2.id,
          courseId: testCourse.id,
          amount: testCourse.price,
        },
      });

      expect(firstBooking.id).toBeDefined();
      expect(secondBooking.id).toBeDefined();
      expect(firstBooking.id).not.toBe(secondBooking.id);
    });
  });

  describe('Payment Status Validation', () => {
    it('should accept all valid PaymentStatus values', async () => {
      const statuses: PaymentStatus[] = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUNDED,
      ];

      // Create additional users for this test
      const testUsers = [];
      for (let i = 0; i < statuses.length; i++) {
        const user = await prisma.user.create({
          data: {
            id: `status-test-user-${i}`,
            email: `statustest${i}@example.com`,
            name: `Status Test User ${i}`,
          },
        });
        testUsers.push(user);
      }

      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const booking = await prisma.booking.create({
          data: {
            userId: testUsers[i].id,
            courseId: testCourse.id,
            amount: testCourse.price,
            paymentStatus: status,
          },
        });

        expect(booking.paymentStatus).toBe(status);
      }
    });

    it('should default to PENDING status', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          // No paymentStatus specified
        },
      });

      expect(booking.paymentStatus).toBe(PaymentStatus.PENDING);
    });
  });

  describe('Optional Stripe Fields', () => {
    it('should accept null Stripe payment intent ID', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          stripePaymentIntentId: null,
        },
      });

      expect(booking.stripePaymentIntentId).toBeNull();
    });

    it('should accept valid Stripe payment intent ID', async () => {
      const paymentIntentId = 'pi_test_1234567890';
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          stripePaymentIntentId: paymentIntentId,
        },
      });

      expect(booking.stripePaymentIntentId).toBe(paymentIntentId);
    });

    it('should accept null Stripe session ID', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          stripeSessionId: null,
        },
      });

      expect(booking.stripeSessionId).toBeNull();
    });

    it('should accept valid Stripe session ID', async () => {
      const sessionId = 'cs_test_session_1234567890';
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          stripeSessionId: sessionId,
        },
      });

      expect(booking.stripeSessionId).toBe(sessionId);
    });
  });

  describe('Currency and Amount Validation', () => {
    it('should handle different currencies', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: 8500, // €85.00 in cents
          currency: 'EUR',
        },
      });

      expect(booking.currency).toBe('EUR');
      expect(booking.amount).toBe(8500);
    });

    it('should default to USD currency', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
          // No currency specified
        },
      });

      expect(booking.currency).toBe('USD');
    });

    it('should accept zero amount for free courses', async () => {
      const freeCourse = await prisma.course.create({
        data: {
          title: 'Free Course',
          slug: 'free-course',
          price: 0,
          isPublished: true,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: freeCourse.id,
          amount: 0,
        },
      });

      expect(booking.amount).toBe(0);
    });
  });

  describe('Relationship Constraints', () => {
    it('should maintain referential integrity on course deletion', async () => {
      const booking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: testCourse.id,
          amount: testCourse.price,
        },
      });

      expect(booking.courseId).toBe(testCourse.id);

      // Delete the course (should cascade delete the booking)
      await prisma.course.delete({
        where: { id: testCourse.id },
      });

      // Booking should be deleted due to CASCADE
      const deletedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
      });

      expect(deletedBooking).toBeNull();
    });
  });
});
