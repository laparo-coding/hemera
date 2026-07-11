/**
 * T011: Integration Test - Dashboard Sections Display
 *
 * Tests for the complete dashboard sections workflow,
 * including data fetching, categorization, and rendering.
 */

import { ParticipationStatus, PaymentStatus } from '@prisma/client';
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@/tests/vitest/jest-globals';
import { closeDb, prisma } from '../../lib/db/prisma';

describe('Dashboard Sections Integration', () => {
  const now = new Date('2026-01-24T12:00:00Z');

  let testUser: { id: string };
  let upcomingCourse1: { id: string };
  let upcomingCourse2: { id: string };
  let completedCourse: { id: string };
  let noShowCourse: { id: string };

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.courseParticipation.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const timestamp = Date.now();
    const randomSuffix = crypto.randomUUID().split('-')[0];

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: `user_dashboard_${timestamp}_${randomSuffix}`,
        email: `dashboard-${timestamp}@example.com`,
        name: 'Dashboard Test User',
      },
    });

    // Create courses for different sections
    upcomingCourse1 = await prisma.course.create({
      data: {
        id: `course-upcoming1-${timestamp}`,
        title: 'Nächstes Seminar Kurs',
        slug: `naechstes-seminar-${timestamp}`,
        price: 29900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-01'),
        startTime: new Date('2026-02-01T09:00:00Z'),
        endTime: new Date('2026-02-01T17:00:00Z'),
      },
    });

    upcomingCourse2 = await prisma.course.create({
      data: {
        id: `course-upcoming2-${timestamp}`,
        title: 'Weiteres Seminar',
        slug: `weiteres-seminar-${timestamp}`,
        price: 39900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-16'),
      },
    });

    completedCourse = await prisma.course.create({
      data: {
        id: `course-completed-${timestamp}`,
        title: 'Absolvierter Kurs',
        slug: `absolvierter-kurs-${timestamp}`,
        price: 49900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-01-10'),
      },
    });

    noShowCourse = await prisma.course.create({
      data: {
        id: `course-noshow-${timestamp}`,
        title: 'Verpasster Kurs',
        slug: `verpasster-kurs-${timestamp}`,
        price: 19900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-05'),
      },
    });

    // Create bookings
    const _booking1 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        courseId: upcomingCourse1.id,
        amount: 29900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await prisma.booking.create({
      data: {
        userId: testUser.id,
        courseId: upcomingCourse2.id,
        amount: 39900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const completedBooking = await prisma.booking.create({
      data: {
        userId: testUser.id,
        courseId: completedCourse.id,
        amount: 49900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await prisma.booking.create({
      data: {
        userId: testUser.id,
        courseId: noShowCourse.id,
        amount: 19900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
      },
    });

    // Create participation for completed course
    await prisma.courseParticipation.create({
      data: {
        bookingId: completedBooking.id,
        userId: testUser.id,
        courseId: completedCourse.id,
        status: ParticipationStatus.COMPLETE,
      },
    });
  });

  describe('Data fetching for dashboard', () => {
    it('should fetch all bookings with course and participation data', async () => {
      const bookings = await prisma.booking.findMany({
        where: { userId: testUser.id },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
            },
          },
          participation: {
            select: { id: true },
          },
        },
        orderBy: {
          course: { startDate: 'asc' },
        },
      });

      expect(bookings.length).toBe(4);
    });

    it('should include course schedule data', async () => {
      const booking = await prisma.booking.findFirst({
        where: { courseId: upcomingCourse1.id },
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

      expect(booking?.course.startDate).toBeInstanceOf(Date);
      expect(booking?.course.endDate).toBeInstanceOf(Date);
    });

    it('should detect participation existence', async () => {
      const bookings = await prisma.booking.findMany({
        where: { userId: testUser.id },
        include: {
          course: true,
          participation: { select: { id: true } },
        },
      });

      const completedBooking = bookings.find(
        b => b.courseId === completedCourse.id
      );
      const noShowBooking = bookings.find(b => b.courseId === noShowCourse.id);

      expect(completedBooking?.participation).not.toBeNull();
      expect(noShowBooking?.participation).toBeNull();
    });
  });

  describe('Section categorization', () => {
    it('should categorize bookings into 4 sections', async () => {
      const bookings = await prisma.booking.findMany({
        where: {
          userId: testUser.id,
          paymentStatus: { not: PaymentStatus.CANCELLED },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
          participation: { select: { id: true } },
        },
      });

      // Categorize
      const upcoming = bookings.filter(b => {
        const endDate = b.course.endDate || b.course.startDate;
        return endDate && endDate > now;
      });

      const past = bookings.filter(b => {
        const endDate = b.course.endDate || b.course.startDate;
        return endDate && endDate <= now;
      });

      const completed = past.filter(b => b.participation !== null);
      const noShow = past.filter(b => b.participation === null);

      const nextSeminar = upcoming.sort((a, b) => {
        const dateA = a.course.startDate?.getTime() || 0;
        const dateB = b.course.startDate?.getTime() || 0;
        return dateA - dateB;
      })[0];

      const otherUpcoming = upcoming.filter(b => b.id !== nextSeminar?.id);

      expect(nextSeminar?.course.title).toBe('Nächstes Seminar Kurs');
      expect(otherUpcoming.length).toBe(1);
      expect(completed.length).toBe(1);
      expect(noShow.length).toBe(1);
    });

    it('should exclude cancelled bookings', async () => {
      // Create a cancelled booking
      const cancelledCourse = await prisma.course.create({
        data: {
          title: 'Stornierter Kurs',
          slug: `storniert-${Date.now()}`,
          price: 9900,
          currency: 'EUR',
          startDate: new Date('2026-04-01'),
        },
      });

      await prisma.booking.create({
        data: {
          userId: testUser.id,
          courseId: cancelledCourse.id,
          amount: 9900,
          currency: 'EUR',
          paymentStatus: PaymentStatus.CANCELLED,
        },
      });

      const activeBookings = await prisma.booking.findMany({
        where: {
          userId: testUser.id,
          paymentStatus: { not: PaymentStatus.CANCELLED },
        },
      });

      expect(activeBookings.length).toBe(4); // Original 4, not 5
    });
  });

  describe('Section ordering', () => {
    it('should order upcoming courses by start date ascending', async () => {
      const upcomingBookings = await prisma.booking.findMany({
        where: {
          userId: testUser.id,
          course: { startDate: { gt: now } },
        },
        include: { course: { select: { startDate: true, title: true } } },
        orderBy: { course: { startDate: 'asc' } },
      });

      expect(upcomingBookings).toHaveLength(2);
      expect(upcomingBookings[0]!.course.title).toBe('Nächstes Seminar Kurs');
      expect(upcomingBookings[1]!.course.title).toBe('Weiteres Seminar');
    });
  });

  describe('Empty section handling', () => {
    it('should handle user with no bookings', async () => {
      const emptyUser = await prisma.user.create({
        data: {
          id: `user_empty_${Date.now()}`,
          email: `empty-${Date.now()}@example.com`,
          name: 'Empty User',
        },
      });

      const bookings = await prisma.booking.findMany({
        where: { userId: emptyUser.id },
      });

      expect(bookings.length).toBe(0);
    });

    it('should handle user with only upcoming bookings', async () => {
      // Create user with only future booking
      const futureUser = await prisma.user.create({
        data: {
          id: `user_future_${Date.now()}`,
          email: `future-${Date.now()}@example.com`,
        },
      });

      await prisma.booking.create({
        data: {
          userId: futureUser.id,
          courseId: upcomingCourse1.id,
          amount: 29900,
          currency: 'EUR',
          paymentStatus: PaymentStatus.PAID,
        },
      });

      const bookings = await prisma.booking.findMany({
        where: { userId: futureUser.id },
        include: { course: true, participation: true },
      });

      const past = bookings.filter(
        b => b.course.startDate && b.course.startDate <= now
      );

      expect(past.length).toBe(0);
    });
  });
});
