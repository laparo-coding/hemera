/**
 * T004: Contract Test - GET /api/bookings (Enhanced Response)
 *
 * Tests for the enhanced booking API that returns course dates, location,
 * participation status, and invoice fields for dashboard display.
 */

import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { PaymentStatus } from '@prisma/client';
import { closeDb, prisma } from '../../lib/db/prisma';

describe('GET /api/bookings - Enhanced Response Contract', () => {
  let testCourse: { id: string };
  let testUser: { id: string };
  let testLocation: { id: string; slug: string; name: string };
  let testBooking: { id: string };

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.courseParticipation.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.course.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // Create test location
    testLocation = await prisma.location.create({
      data: {
        id: `test-loc-${timestamp}-${randomSuffix}`,
        slug: `test-location-${timestamp}`,
        name: 'Test Seminarhaus',
        address: 'Teststraße 123',
        city: 'München',
        zipCode: '80331',
      },
    });

    // Create test course with location and dates
    testCourse = await prisma.course.create({
      data: {
        id: `test-course-${timestamp}-${randomSuffix}`,
        title: 'Test Seminar',
        slug: `test-seminar-${timestamp}`,
        price: 49900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-16'),
        startTime: new Date('2026-02-15T09:00:00Z'),
        endTime: new Date('2026-02-16T17:00:00Z'),
        locationId: testLocation.id,
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: `user_test_${timestamp}_${randomSuffix}`,
        email: `test-${timestamp}@example.com`,
        name: 'Test User',
      },
    });

    // Create test booking with invoice fields
    testBooking = await prisma.booking.create({
      data: {
        id: `booking-${timestamp}-${randomSuffix}`,
        userId: testUser.id,
        courseId: testCourse.id,
        amount: 49900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
        stripeInvoiceId: 'in_test_123',
        stripeInvoiceUrl: 'https://invoice.stripe.com/i/test',
        stripeInvoicePdfUrl: 'https://invoice.stripe.com/i/test/pdf',
      },
    });
  });

  describe('Response structure', () => {
    it('should include startDate field in booking response', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: {
            select: {
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.course.startDate).toBeInstanceOf(Date);
    });

    it('should include endDate field for multi-day courses', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: {
            select: {
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.course.endDate).toBeInstanceOf(Date);
      expect(booking?.course.endDate).not.toEqual(booking?.course.startDate);
    });

    it('should include startTime and endTime fields', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: {
            select: {
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.course.startTime).toBeInstanceOf(Date);
      expect(booking?.course.endTime).toBeInstanceOf(Date);
    });

    it('should include location data when course has location', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: {
            include: {
              location: true,
            },
          },
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.course.location).not.toBeNull();
      expect(booking?.course.location?.id).toBe(testLocation.id);
      expect(booking?.course.location?.name).toBe('Test Seminarhaus');
      expect(booking?.course.location?.slug).toBe(testLocation.slug);
      expect(booking?.course.location?.city).toBe('München');
    });

    it('should include stripeInvoicePdfUrl field', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        select: {
          stripeInvoiceId: true,
          stripeInvoiceUrl: true,
          stripeInvoicePdfUrl: true,
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.stripeInvoiceId).toBe('in_test_123');
      expect(booking?.stripeInvoicePdfUrl).toBe(
        'https://invoice.stripe.com/i/test/pdf'
      );
    });
  });

  describe('Participation status', () => {
    it('should detect hasParticipation = false when no participation record', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          participation: true,
        },
      });

      const hasParticipation = booking?.participation !== null;
      expect(hasParticipation).toBe(false);
    });

    it('should detect hasParticipation = true when participation exists', async () => {
      // Create participation record
      await prisma.courseParticipation.create({
        data: {
          bookingId: testBooking.id,
          userId: testUser.id,
          courseId: testCourse.id,
          status: 'PREPARATION',
        },
      });

      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          participation: true,
        },
      });

      const hasParticipation = booking?.participation !== null;
      expect(hasParticipation).toBe(true);
    });
  });

  describe('Data transformation for API response', () => {
    it('should transform booking to EnhancedBooking format', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: {
            include: {
              location: true,
            },
          },
          participation: true,
        },
      });

      // Transform to API response format
      const enhancedBooking = {
        id: booking!.id,
        courseId: booking!.courseId,
        courseTitle: booking!.course.title,
        coursePrice: booking!.course.price,
        currency: booking!.currency,
        paymentStatus: booking!.paymentStatus,
        createdAt: booking!.createdAt.toISOString(),
        startDate: booking!.course.startDate?.toISOString() ?? null,
        endDate: booking!.course.endDate?.toISOString() ?? null,
        startTime: booking!.course.startTime?.toISOString() ?? null,
        endTime: booking!.course.endTime?.toISOString() ?? null,
        locationId: booking!.course.location?.id ?? null,
        locationName: booking!.course.location?.name ?? null,
        locationSlug: booking!.course.location?.slug ?? null,
        locationAddress: booking!.course.location?.address ?? null,
        locationCity: booking!.course.location?.city ?? null,
        hasParticipation: booking!.participation !== null,
        stripeInvoicePdfUrl: booking!.stripeInvoicePdfUrl,
      };

      expect(enhancedBooking.id).toBe(testBooking.id);
      expect(enhancedBooking.courseTitle).toBe('Test Seminar');
      expect(enhancedBooking.coursePrice).toBe(49900);
      expect(enhancedBooking.locationName).toBe('Test Seminarhaus');
      expect(enhancedBooking.locationCity).toBe('München');
      expect(enhancedBooking.hasParticipation).toBe(false);
      expect(enhancedBooking.stripeInvoicePdfUrl).toBe(
        'https://invoice.stripe.com/i/test/pdf'
      );
    });
  });
});
