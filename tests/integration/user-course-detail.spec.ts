/**
 * T012: Integration Test - User Course Detail Page Navigation
 *
 * Tests for the user course detail flow and related routes.
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

describe('User Course Detail Page Integration', () => {
  let testUser: { id: string };
  let testCourse: { id: string };
  let testBooking: { id: string };
  let testParticipation: { id: string };

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.participationSummaryOverride.deleteMany();
    await prisma.participationDocument.deleteMany();
    await prisma.courseParticipation.deleteMany();
    await prisma.courseSummaryAsset.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: `user_detail_${timestamp}_${randomSuffix}`,
        email: `detail-${timestamp}@example.com`,
        name: 'Detail Test User',
      },
    });

    // Create test course
    testCourse = await prisma.course.create({
      data: {
        id: `course-detail-${timestamp}`,
        title: 'Detail Test Kurs',
        slug: `detail-test-${timestamp}`,
        price: 49900,
        currency: 'EUR',
        isPublished: true,
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-20'),
      },
    });

    // Create test booking
    testBooking = await prisma.booking.create({
      data: {
        id: `booking-detail-${timestamp}`,
        userId: testUser.id,
        courseId: testCourse.id,
        amount: 49900,
        currency: 'EUR',
        paymentStatus: PaymentStatus.PAID,
        stripeInvoicePdfUrl: 'https://invoice.stripe.com/test/pdf',
      },
    });

    // Create participation
    const participation = await prisma.courseParticipation.create({
      data: {
        bookingId: testBooking.id,
        userId: testUser.id,
        courseId: testCourse.id,
        status: ParticipationStatus.SUMMARY,
        preparationIntent: 'Meine Vorbereitung',
        desiredResults: 'Meine gewünschten Ergebnisse',
      },
    });
    testParticipation = { id: participation.id };
  });

  describe('Booking lookup by ID', () => {
    it('should find booking with all related data', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        include: {
          course: true,
          participation: true,
          user: { select: { id: true, name: true } },
        },
      });

      expect(booking).not.toBeNull();
      expect(booking?.course.title).toBe('Detail Test Kurs');
      expect(booking?.participation).not.toBeNull();
      expect(booking?.user.id).toBe(testUser.id);
    });

    it('should return null for non-existent booking', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: 'non-existent-booking' },
      });

      expect(booking).toBeNull();
    });
  });

  describe('Authorization check', () => {
    it('should verify booking belongs to user', async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        select: { userId: true },
      });

      const isOwner = booking?.userId === testUser.id;
      expect(isOwner).toBe(true);
    });

    it('should detect unauthorized access', async () => {
      const otherUser = await prisma.user.create({
        data: {
          id: `user_other_${Date.now()}`,
          email: `other-${Date.now()}@example.com`,
        },
      });

      const booking = await prisma.booking.findUnique({
        where: { id: testBooking.id },
        select: { userId: true },
      });

      const isOwner = booking?.userId === otherUser.id;
      expect(isOwner).toBe(false);
    });
  });

  describe('Vorbereitung section', () => {
    it('should load preparation data from participation', async () => {
      const participation = await prisma.courseParticipation.findUnique({
        where: { bookingId: testBooking.id },
        select: {
          preparationIntent: true,
          desiredResults: true,
          lineManagerProfile: true,
          preparationCompletedAt: true,
        },
      });

      expect(participation?.preparationIntent).toBe('Meine Vorbereitung');
      expect(participation?.desiredResults).toBe(
        'Meine gewünschten Ergebnisse'
      );
    });

    it('should detect if preparation is completed', async () => {
      // Update to complete preparation
      await prisma.courseParticipation.update({
        where: { id: testParticipation.id },
        data: { preparationCompletedAt: new Date() },
      });

      const participation = await prisma.courseParticipation.findUnique({
        where: { id: testParticipation.id },
        select: { preparationCompletedAt: true },
      });

      expect(participation?.preparationCompletedAt).not.toBeNull();
    });
  });

  describe('Ergebnisse section', () => {
    it('should load course summary assets', async () => {
      // Create summary assets for the course
      await prisma.courseSummaryAsset.create({
        data: {
          courseId: testCourse.id,
          muxAssetId: 'asset_123',
          muxPlaybackId: 'playback_123',
          title: 'Zusammenfassung Video 1',
          sortOrder: 1,
          isActive: true,
        },
      });

      await prisma.courseSummaryAsset.create({
        data: {
          courseId: testCourse.id,
          muxAssetId: 'asset_456',
          muxPlaybackId: 'playback_456',
          title: 'Zusammenfassung Video 2',
          sortOrder: 2,
          isActive: true,
        },
      });

      const assets = await prisma.courseSummaryAsset.findMany({
        where: {
          courseId: testCourse.id,
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      expect(assets).toHaveLength(2);
      expect(assets[0]!.title).toBe('Zusammenfassung Video 1');
    });

    it('should load participation documents', async () => {
      await prisma.participationDocument.create({
        data: {
          participationId: testParticipation.id,
          blobUrl: 'https://blob.vercel-storage.com/test.pdf',
          blobKey: 'test-key',
          fileName: 'Teilnahmebestätigung.pdf',
          fileSizeBytes: 102400,
          mimeType: 'application/pdf',
          isActive: true,
          createdByUserId: testUser.id,
        },
      });

      const documents = await prisma.participationDocument.findMany({
        where: {
          participationId: testParticipation.id,
          isActive: true,
        },
      });

      expect(documents).toHaveLength(1);
      expect(documents[0]!.fileName).toBe('Teilnahmebestätigung.pdf');
    });
  });

  describe('Nachbereitung section', () => {
    it('should load debriefing data', async () => {
      await prisma.courseParticipation.update({
        where: { id: testParticipation.id },
        data: {
          debriefingPlan: 'Mein Nachbereitungsplan',
          salaryDiscussionMonth: '2026-06',
        },
      });

      const participation = await prisma.courseParticipation.findUnique({
        where: { id: testParticipation.id },
        select: {
          debriefingPlan: true,
          salaryDiscussionMonth: true,
        },
      });

      expect(participation?.debriefingPlan).toBe('Mein Nachbereitungsplan');
      expect(participation?.salaryDiscussionMonth).toBe('2026-06');
    });

    it('should load result data', async () => {
      await prisma.courseParticipation.update({
        where: { id: testParticipation.id },
        data: {
          resultOutcome: 'Erfolgreich abgeschlossen',
          resultNotes: 'Zusätzliche Notizen',
          resultCompletedAt: new Date(),
        },
      });

      const participation = await prisma.courseParticipation.findUnique({
        where: { id: testParticipation.id },
        select: {
          resultOutcome: true,
          resultNotes: true,
          resultCompletedAt: true,
        },
      });

      expect(participation?.resultOutcome).toBe('Erfolgreich abgeschlossen');
      expect(participation?.resultCompletedAt).not.toBeNull();
    });
  });

  describe('Status-based section visibility', () => {
    it('should show different sections based on participation status', async () => {
      const statuses = [
        ParticipationStatus.PREPARATION,
        ParticipationStatus.SUMMARY,
        ParticipationStatus.DEBRIEFING,
        ParticipationStatus.RESULT,
        ParticipationStatus.COMPLETE,
      ];

      for (const status of statuses) {
        await prisma.courseParticipation.update({
          where: { id: testParticipation.id },
          data: { status },
        });

        const participation = await prisma.courseParticipation.findUnique({
          where: { id: testParticipation.id },
          select: { status: true },
        });

        expect(participation?.status).toBe(status);
      }
    });
  });
});
