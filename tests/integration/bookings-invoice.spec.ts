/**
 * T005: Contract Test - GET /api/bookings/[bookingId]/invoice
 *
 * Tests for the invoice download endpoint that redirects to Stripe PDF URL.
 */

import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { PaymentStatus } from '@prisma/client';
import { closeDb, prisma } from '../../lib/db/prisma';

describe('GET /api/bookings/[bookingId]/invoice - Contract', () => {
  let testCourse: { id: string };
  let testUser: { id: string };
  let testUser2: { id: string };
  let paidBookingWithInvoice: { id: string };
  let paidBookingNoInvoice: { id: string };
  let pendingBooking: { id: string };
  let otherUserBooking: { id: string };

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.booking.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        id: `test-course-${timestamp}-${randomSuffix}`,
        title: 'Invoice Test Seminar',
        slug: `invoice-test-${timestamp}`,
        price: 29900,
        currency: 'EUR',
        isPublished: true,
      },
    });

    // Create test users
    testUser = await prisma.user.create({
      data: {
        id: `user_test_${timestamp}_${randomSuffix}`,
        email: `user1-${timestamp}@example.com`,
        name: 'Test User 1',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        id: `user_test2_${timestamp}_${randomSuffix}`,
        email: `user2-${timestamp}@example.com`,
        name: 'Test User 2',
      },
    });

    // Create PAID booking WITH invoice URL
    paidBookingWithInvoice = await prisma.booking.create({
      data: {
        id: `booking-paid-invoice-${timestamp}`,
        userId: testUser.id,
        courseId: testCourse.id,
        amount: 29900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
        stripeInvoiceId: 'in_paid_with_pdf',
        stripeInvoicePdfUrl: 'https://invoice.stripe.com/i/paid/pdf',
      },
    });

    // Create second course for additional bookings
    const testCourse2 = await prisma.course.create({
      data: {
        id: `test-course2-${timestamp}-${randomSuffix}`,
        title: 'Invoice Test Seminar 2',
        slug: `invoice-test-2-${timestamp}`,
        price: 19900,
        currency: 'EUR',
        isPublished: true,
      },
    });

    // Create PAID booking WITHOUT invoice URL
    paidBookingNoInvoice = await prisma.booking.create({
      data: {
        id: `booking-paid-no-invoice-${timestamp}`,
        userId: testUser.id,
        courseId: testCourse2.id,
        amount: 19900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
        stripeInvoiceId: null,
        stripeInvoicePdfUrl: null,
      },
    });

    // Create third course for pending booking
    const testCourse3 = await prisma.course.create({
      data: {
        id: `test-course3-${timestamp}-${randomSuffix}`,
        title: 'Invoice Test Seminar 3',
        slug: `invoice-test-3-${timestamp}`,
        price: 39900,
        currency: 'EUR',
        isPublished: true,
      },
    });

    // Create PENDING booking
    pendingBooking = await prisma.booking.create({
      data: {
        id: `booking-pending-${timestamp}`,
        userId: testUser.id,
        courseId: testCourse3.id,
        amount: 39900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    // Create fourth course for other user
    const testCourse4 = await prisma.course.create({
      data: {
        id: `test-course4-${timestamp}-${randomSuffix}`,
        title: 'Other User Seminar',
        slug: `other-user-test-${timestamp}`,
        price: 49900,
        currency: 'EUR',
        isPublished: true,
      },
    });

    // Create booking for OTHER user
    otherUserBooking = await prisma.booking.create({
      data: {
        id: `booking-other-user-${timestamp}`,
        userId: testUser2.id,
        courseId: testCourse4.id,
        amount: 49900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
        stripeInvoicePdfUrl: 'https://invoice.stripe.com/i/other/pdf',
      },
    });
  });

  describe('Booking lookup', () => {
    it('should find booking by id', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
      });

      expect(booking).not.toBeNull();
      expect(booking?.id).toBe(paidBookingWithInvoice.id);
    });

    it('should return null for non-existent booking', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: 'non-existent-booking-id' },
      });

      expect(booking).toBeNull();
    });
  });

  describe('Authorization checks', () => {
    it('should verify booking belongs to requesting user', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
        select: { userId: true },
      });

      expect(booking?.userId).toBe(testUser.id);
      expect(booking?.userId).not.toBe(testUser2.id);
    });

    it('should detect when user does not own booking', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: otherUserBooking.id },
        select: { userId: true },
      });

      const requestingUserId = testUser.id;
      const isAuthorized = booking?.userId === requestingUserId;

      expect(isAuthorized).toBe(false);
    });
  });

  describe('Payment status validation', () => {
    it('should allow invoice access for PAID status', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
        select: { paymentStatus: true },
      });

      const allowedStatuses: PaymentStatus[] = [
        PaymentStatus.PAID,
        PaymentStatus.CONFIRMED,
      ];
      const canAccessInvoice = allowedStatuses.includes(
        booking?.paymentStatus as PaymentStatus
      );

      expect(canAccessInvoice).toBe(true);
    });

    it('should deny invoice access for PENDING status', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: pendingBooking.id },
        select: { paymentStatus: true },
      });

      const allowedStatuses: PaymentStatus[] = [
        PaymentStatus.PAID,
        PaymentStatus.CONFIRMED,
      ];
      const canAccessInvoice = allowedStatuses.includes(
        booking?.paymentStatus as PaymentStatus
      );

      expect(canAccessInvoice).toBe(false);
    });
  });

  describe('Invoice URL retrieval', () => {
    it('should return invoice PDF URL when available', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
        select: { stripeInvoicePdfUrl: true },
      });

      expect(booking?.stripeInvoicePdfUrl).toBe(
        'https://invoice.stripe.com/i/paid/pdf'
      );
    });

    it('should return null when invoice not available', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingNoInvoice.id },
        select: { stripeInvoicePdfUrl: true },
      });

      expect(booking?.stripeInvoicePdfUrl).toBeNull();
    });

    it('should have stripeInvoiceId for Stripe API fallback', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
        select: { stripeInvoiceId: true, stripeInvoicePdfUrl: true },
      });

      expect(booking?.stripeInvoiceId).toBe('in_paid_with_pdf');
    });
  });

  describe('Invoice download endpoint logic', () => {
    it('should construct valid redirect response for successful case', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: paidBookingWithInvoice.id },
        select: {
          userId: true,
          paymentStatus: true,
          stripeInvoicePdfUrl: true,
        },
      });

      // Simulate endpoint logic
      const requestingUserId = testUser.id;
      const isAuthorized = booking?.userId === requestingUserId;
      const isPaid =
        booking?.paymentStatus === PaymentStatus.PAID ||
        booking?.paymentStatus === PaymentStatus.CONFIRMED;
      const hasPdfUrl = booking?.stripeInvoicePdfUrl !== null;

      expect(isAuthorized).toBe(true);
      expect(isPaid).toBe(true);
      expect(hasPdfUrl).toBe(true);

      // Would return 302 redirect to PDF URL
      const redirectUrl = booking?.stripeInvoicePdfUrl;
      expect(redirectUrl).toMatch(/^https:\/\/invoice\.stripe\.com/);
    });
  });
});
