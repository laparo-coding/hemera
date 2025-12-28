/**
 * Participation Server Actions Tests
 *
 * Tests for authorization, data normalization, and Rollbar logging paths.
 */

import { auth } from '@clerk/nextjs/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    courseParticipation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    participationDocument: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    courseSummaryAsset: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    participationSummaryOverride: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(fn =>
      fn({
        participationDocument: {
          update: jest.fn(),
          create: jest.fn(),
        },
      })
    ),
  },
}));

// Mock Rollbar
jest.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock resumeUpload
jest.mock('@/lib/utils/resumeUpload', () => ({
  uploadResume: jest.fn(),
  deleteResume: jest.fn(),
}));

import {
  completePreparationAction,
  saveDebriefingAction,
  savePreparationAction,
  saveResultAction,
} from '@/lib/actions/participation';
import { prisma } from '@/lib/db/prisma';
import { serverInstance } from '@/lib/monitoring/rollbar-official';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock participation data
const mockParticipation = {
  id: 'part-123',
  bookingId: 'booking-123',
  userId: 'user-123',
  courseId: 'course-123',
  status: 'PREPARATION',
  preparationIntent: null,
  desiredResults: null,
  lineManagerProfile: null,
  preparationCompletedAt: null,
  summaryPresentedAt: null,
  summaryAssetSource: null,
  summaryCompletedAt: null,
  debriefingPlan: null,
  salaryDiscussionMonth: null,
  resultOutcome: null,
  resultNotes: null,
  resultCompletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  booking: {
    id: 'booking-123',
    userId: 'user-123',
    paymentStatus: 'CONFIRMED',
    course: {
      id: 'course-123',
      title: 'Grundlagen der Gehaltsverhandlung',
      slug: 'grundkurs',
      startDate: new Date('2026-01-15'),
    },
  },
  documents: [],
  summaryOverrides: [],
};

describe('Participation Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('returns error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const result = await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('authentifiziert');
    });

    it('returns error when participation is not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const result = await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('nicht gefunden');
    });

    it('returns error when user does not own the participation', async () => {
      mockAuth.mockResolvedValue({ userId: 'other-user-456' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue({
        ...mockParticipation,
        booking: {
          ...mockParticipation.booking,
          userId: 'user-123', // Different from authenticated user
        },
      });

      const result = await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Berechtigung');
      expect(serverInstance.warning).toHaveBeenCalledWith(
        'Unauthorized participation access attempt',
        expect.any(Object)
      );
    });

    it('succeeds when user owns the participation', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      const result = await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data normalization', () => {
    it('saves preparation data correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      await savePreparationAction('booking-123', {
        preparationIntent: 'My goals',
        desiredResults: 'Salary increase',
        lineManagerProfile: 'Analytical type',
      });

      expect(prisma.courseParticipation.update).toHaveBeenCalledWith({
        where: { id: 'part-123' },
        data: expect.objectContaining({
          preparationIntent: 'My goals',
          desiredResults: 'Salary increase',
          lineManagerProfile: 'Analytical type',
        }),
      });
    });

    it('saves debriefing data correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue({
        ...mockParticipation,
        status: 'DEBRIEFING',
      });
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      await saveDebriefingAction('booking-123', {
        debriefingPlan: 'Discussion plan',
        salaryDiscussionMonth: '2026-03',
      });

      expect(prisma.courseParticipation.update).toHaveBeenCalledWith({
        where: { id: 'part-123' },
        data: expect.objectContaining({
          debriefingPlan: 'Discussion plan',
          salaryDiscussionMonth: '2026-03',
        }),
      });
    });

    it('saves result data correctly', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue({
        ...mockParticipation,
        status: 'RESULT',
      });
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      await saveResultAction('booking-123', {
        resultOutcome: 'Got 10% raise',
        resultNotes: 'Very successful negotiation',
      });

      expect(prisma.courseParticipation.update).toHaveBeenCalledWith({
        where: { id: 'part-123' },
        data: expect.objectContaining({
          resultOutcome: 'Got 10% raise',
          resultNotes: 'Very successful negotiation',
        }),
      });
    });
  });

  describe('Rollbar logging', () => {
    it('logs info on successful preparation save', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(serverInstance.info).toHaveBeenCalledWith(
        'Preparation data saved',
        expect.objectContaining({
          userId: 'user-123',
          participationId: 'part-123',
          bookingId: 'booking-123',
        })
      );
    });

    it('logs info on preparation step completion', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      await completePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(serverInstance.info).toHaveBeenCalledWith(
        'Preparation step completed',
        expect.objectContaining({
          userId: 'user-123',
          participationId: 'part-123',
        })
      );
    });

    it('logs error on failure', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await savePreparationAction('booking-123', {
        preparationIntent: 'Test intent',
      });

      expect(serverInstance.error).toHaveBeenCalledWith(
        'Failed to save preparation',
        expect.any(Error),
        expect.objectContaining({ bookingId: 'booking-123' })
      );
    });
  });

  describe('Step completion', () => {
    it('completes preparation and advances status', async () => {
      mockAuth.mockResolvedValue({ userId: 'user-123' } as any);
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );
      (prisma.courseParticipation.update as jest.Mock).mockResolvedValue({
        ...mockParticipation,
        status: 'SUMMARY',
      });

      const result = await completePreparationAction('booking-123', {
        preparationIntent: 'Completed intent',
      });

      expect(result.success).toBe(true);
      // Update should be called twice: once for data, once for status
      expect(prisma.courseParticipation.update).toHaveBeenCalledTimes(2);
    });
  });
});
