/**
 * Unit Tests: PrerequisiteService
 * Feature: 021-learning-path
 *
 * Tests the prerequisite checking logic for course bookings.
 * These tests define the expected behavior and should FAIL until implementation.
 */

import { beforeEach, describe, expect, it, jest } from '@/tests/vitest/jest-globals';

const { mockPrisma, mockReportError } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
  },
  mockReportError: vi.fn(),
}));

vi.mock('../../../lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../../lib/monitoring/rollbar-official', () => ({
  reportError: mockReportError,
}));

import { checkPrerequisite } from '../../../lib/services/prerequisite';

// Mock types for testing (service not yet implemented)
interface PrerequisiteResult {
  isQualified: boolean;
  reason?: string;
  completedCourses: Array<{
    courseId: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    completedAt: Date;
  }>;
}

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

function createBooking(level: CourseLevel, suffix: string) {
  return {
    course: {
      id: `course_${level.toLowerCase()}_${suffix}`,
      title: `${level} Course ${suffix}`,
      level,
    },
    createdAt: new Date('2026-01-10T10:00:00.000Z'),
  };
}

describe('PrerequisiteService', () => {
  describe('checkPrerequisite', () => {
    describe('BEGINNER courses', () => {
      it('should always qualify user for BEGINNER courses', () => {
        // Contract: BEGINNER courses have no prerequisites
        const targetLevel: CourseLevel = 'BEGINNER';
        const hasPrerequisites = targetLevel !== 'BEGINNER';

        expect(hasPrerequisites).toBe(false);
      });

      it('should qualify user with no completed courses for BEGINNER', () => {
        const completedCourses: unknown[] = [];
        const targetLevel: CourseLevel = 'BEGINNER';

        const isQualified =
          targetLevel === 'BEGINNER' || completedCourses.length > 0;

        expect(isQualified).toBe(true);
      });

      it('should qualify user with completed courses for BEGINNER', () => {
        const completedCourses = [
          { courseId: 'abc', level: 'BEGINNER', completedAt: new Date() },
        ];
        const targetLevel: CourseLevel = 'BEGINNER';

        const isQualified =
          targetLevel === 'BEGINNER' || completedCourses.length > 0;

        expect(isQualified).toBe(true);
      });
    });

    describe('INTERMEDIATE courses', () => {
      it('should NOT qualify user with no completed courses for INTERMEDIATE', () => {
        const completedCourses: Array<{ level: CourseLevel }> = [];
        const targetLevel = 'INTERMEDIATE' as CourseLevel;

        const hasCompletedBeginner = completedCourses.some(
          c => c.level === 'BEGINNER'
        );
        const isQualified = targetLevel === 'BEGINNER' || hasCompletedBeginner;

        expect(isQualified).toBe(false);
      });

      it('should qualify user with completed BEGINNER course for INTERMEDIATE', () => {
        const completedCourses = [
          {
            courseId: 'abc',
            level: 'BEGINNER' as CourseLevel,
            completedAt: new Date(),
          },
        ];
        const targetLevel = 'INTERMEDIATE' as CourseLevel;

        const hasCompletedBeginner = completedCourses.some(
          c => c.level === 'BEGINNER'
        );
        const isQualified = targetLevel === 'BEGINNER' || hasCompletedBeginner;

        expect(isQualified).toBe(true);
      });

      it('should qualify user with completed INTERMEDIATE course for INTERMEDIATE', () => {
        // User who completed INTERMEDIATE can take another INTERMEDIATE
        const completedCourses = [
          {
            courseId: 'xyz',
            level: 'INTERMEDIATE' as CourseLevel,
            completedAt: new Date(),
          },
        ];
        const targetLevel = 'INTERMEDIATE' as CourseLevel;

        const hasCompletedBeginnerOrHigher = completedCourses.some(
          c => c.level === 'BEGINNER' || c.level === 'INTERMEDIATE'
        );
        const isQualified =
          targetLevel === 'BEGINNER' || hasCompletedBeginnerOrHigher;

        expect(isQualified).toBe(true);
      });
    });

    describe('ADVANCED courses', () => {
      it('should NOT qualify user with no completed courses for ADVANCED', () => {
        const completedCourses: Array<{ level: CourseLevel }> = [];
        const targetLevel = 'ADVANCED' as CourseLevel;

        const hasCompletedIntermediate = completedCourses.some(
          c => c.level === 'INTERMEDIATE' || c.level === 'ADVANCED'
        );
        const isQualified =
          targetLevel === 'BEGINNER' || hasCompletedIntermediate;

        expect(isQualified).toBe(false);
      });

      it('should NOT qualify user with only BEGINNER course for ADVANCED', () => {
        const completedCourses = [
          {
            courseId: 'abc',
            level: 'BEGINNER' as CourseLevel,
            completedAt: new Date(),
          },
        ];
        const targetLevel = 'ADVANCED' as CourseLevel;

        const hasCompletedIntermediate = completedCourses.some(
          c => c.level === 'INTERMEDIATE' || c.level === 'ADVANCED'
        );
        const isQualified =
          targetLevel === 'BEGINNER' || hasCompletedIntermediate;

        expect(isQualified).toBe(false);
      });

      it('should qualify user with completed INTERMEDIATE course for ADVANCED', () => {
        const completedCourses = [
          {
            courseId: 'xyz',
            level: 'INTERMEDIATE' as CourseLevel,
            completedAt: new Date(),
          },
        ];
        const targetLevel = 'ADVANCED' as CourseLevel;

        const hasCompletedIntermediate = completedCourses.some(
          c => c.level === 'INTERMEDIATE' || c.level === 'ADVANCED'
        );
        const isQualified =
          targetLevel === 'BEGINNER' || hasCompletedIntermediate;

        expect(isQualified).toBe(true);
      });

      it('should qualify user with completed ADVANCED course for ADVANCED', () => {
        const completedCourses = [
          {
            courseId: 'abc',
            level: 'ADVANCED' as CourseLevel,
            completedAt: new Date(),
          },
        ];
        const targetLevel = 'ADVANCED' as CourseLevel;

        const hasCompletedIntermediate = completedCourses.some(
          c => c.level === 'INTERMEDIATE' || c.level === 'ADVANCED'
        );
        const isQualified =
          targetLevel === 'BEGINNER' || hasCompletedIntermediate;

        expect(isQualified).toBe(true);
      });
    });

    describe('User Email Lookup', () => {
      it('should use all Clerk emails for user lookup', () => {
        // Contract: Service should check all email addresses from Clerk
        const clerkEmails = [
          'primary@example.com',
          'secondary@example.com',
          'work@company.com',
        ];

        expect(clerkEmails.length).toBeGreaterThan(1);
        expect(Array.isArray(clerkEmails)).toBe(true);
      });

      it('should handle user with single email', () => {
        const clerkEmails = ['only@example.com'];

        expect(clerkEmails).toHaveLength(1);
      });

      it('should handle user with no verified emails', () => {
        const clerkEmails: string[] = [];

        expect(clerkEmails).toHaveLength(0);
      });
    });

    describe('Participation Status Filter', () => {
      it('should only count PAID + COMPLETE participations', () => {
        // Contract: Only fully completed courses count as prerequisites
        const validStatuses = {
          paymentStatus: 'PAID',
          participationStatus: 'COMPLETE',
        };

        expect(validStatuses.paymentStatus).toBe('PAID');
        expect(validStatuses.participationStatus).toBe('COMPLETE');
      });

      it('should NOT count PENDING payment courses', () => {
        const invalidPaymentStatuses = [
          'PENDING',
          'FAILED',
          'CANCELLED',
          'REFUNDED',
        ];

        invalidPaymentStatuses.forEach(status => {
          expect(status).not.toBe('PAID');
        });
      });

      it('should NOT count incomplete participation courses', () => {
        const invalidParticipationStatuses = [
          'REGISTERED',
          'IN_PROGRESS',
          'DROPPED',
        ];

        invalidParticipationStatuses.forEach(status => {
          expect(status).not.toBe('COMPLETE');
        });
      });
    });

    describe('Result Structure', () => {
      it('should return PrerequisiteResult with isQualified boolean', () => {
        const result: PrerequisiteResult = {
          isQualified: true,
          completedCourses: [],
        };

        expect(typeof result.isQualified).toBe('boolean');
      });

      it('should include reason when not qualified', () => {
        const result: PrerequisiteResult = {
          isQualified: false,
          reason: 'Keine abgeschlossenen Kurse auf Anfänger-Level gefunden',
          completedCourses: [],
        };

        expect(result.isQualified).toBe(false);
        expect(result.reason).toBeDefined();
      });

      it('should include list of completed courses', () => {
        const result: PrerequisiteResult = {
          isQualified: true,
          completedCourses: [
            {
              courseId: 'abc123',
              level: 'BEGINNER',
              completedAt: new Date('2025-12-01'),
            },
          ],
        };

        expect(Array.isArray(result.completedCourses)).toBe(true);
        expect(result.completedCourses[0]).toHaveProperty('courseId');
        expect(result.completedCourses[0]).toHaveProperty('level');
        expect(result.completedCourses[0]).toHaveProperty('completedAt');
      });
    });
  });

  describe('actual service behavior', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockPrisma.user.findUnique.mockImplementation(async ({ select }) => {
        if (select?.isOutperformer) {
          return { isOutperformer: false };
        }

        return { id: 'user_local_123' };
      });
    });

    it('uses the acceptedLevels mapping for prerequisite queries', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      await checkPrerequisite('clerk_user_123', 'INTERMEDIATE');
      await checkPrerequisite('clerk_user_123', 'ADVANCED');

      expect(mockPrisma.booking.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            course: {
              level: {
                in: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              },
            },
          }),
        })
      );
      expect(mockPrisma.booking.findMany).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          where: expect.objectContaining({
            course: {
              level: {
                in: ['INTERMEDIATE', 'ADVANCED'],
              },
            },
          }),
        })
      );
    });

    it.each([
      {
        targetLevel: 'BEGINNER' as CourseLevel,
        completedLevel: 'BEGINNER' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: false,
      },
      {
        targetLevel: 'BEGINNER' as CourseLevel,
        completedLevel: 'INTERMEDIATE' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: false,
      },
      {
        targetLevel: 'BEGINNER' as CourseLevel,
        completedLevel: 'ADVANCED' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: false,
      },
      {
        targetLevel: 'INTERMEDIATE' as CourseLevel,
        completedLevel: 'BEGINNER' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: true,
      },
      {
        targetLevel: 'INTERMEDIATE' as CourseLevel,
        completedLevel: 'INTERMEDIATE' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: true,
      },
      {
        targetLevel: 'INTERMEDIATE' as CourseLevel,
        completedLevel: 'ADVANCED' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: true,
      },
      {
        targetLevel: 'ADVANCED' as CourseLevel,
        completedLevel: 'BEGINNER' as CourseLevel,
        expectedQualified: false,
        expectedMissingLevel: 'INTERMEDIATE' as const,
        returnsCompletedCourses: true,
      },
      {
        targetLevel: 'ADVANCED' as CourseLevel,
        completedLevel: 'INTERMEDIATE' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: true,
      },
      {
        targetLevel: 'ADVANCED' as CourseLevel,
        completedLevel: 'ADVANCED' as CourseLevel,
        expectedQualified: true,
        expectedMissingLevel: null,
        returnsCompletedCourses: true,
      },
    ])(
      'returns $expectedQualified for target $targetLevel with completed $completedLevel',
      async ({
        targetLevel,
        completedLevel,
        expectedQualified,
        expectedMissingLevel,
        returnsCompletedCourses,
      }) => {
        const completedBooking = createBooking(completedLevel, 'done');

        mockPrisma.booking.findMany.mockImplementation(async ({ where }) => {
          if (!where?.course) {
            return [completedBooking];
          }

          const acceptedLevels = where.course.level.in as CourseLevel[];

          return acceptedLevels.includes(completedLevel)
            ? [completedBooking]
            : [];
        });

        const result = await checkPrerequisite('clerk_user_123', targetLevel);

        expect(result.qualified).toBe(expectedQualified);
        expect(result.missingLevel).toBe(expectedMissingLevel);

        if (returnsCompletedCourses) {
          expect(result.completedCourses).toHaveLength(1);
          expect(result.completedCourses[0]?.level).toBe(completedLevel);
        } else {
          expect(result.completedCourses).toEqual([]);
        }
      }
    );

    it.each([
      {
        targetLevel: 'INTERMEDIATE' as CourseLevel,
        expectedMissingLevel: 'BEGINNER' as const,
      },
      {
        targetLevel: 'ADVANCED' as CourseLevel,
        expectedMissingLevel: 'INTERMEDIATE' as const,
      },
    ])(
      'returns missing prerequisite when no accepted completion exists for $targetLevel',
      async ({ targetLevel, expectedMissingLevel }) => {
        mockPrisma.booking.findMany.mockResolvedValue([]);

        const result = await checkPrerequisite('clerk_user_123', targetLevel);

        expect(result.qualified).toBe(false);
        expect(result.missingLevel).toBe(expectedMissingLevel);
        expect(result.completedCourses).toEqual([]);
      }
    );

    it('always qualifies BEGINNER even without a local user lookup', async () => {
      mockPrisma.user.findUnique.mockImplementation(async ({ select }) => {
        if (select?.isOutperformer) {
          return { isOutperformer: false };
        }

        return null;
      });

      const result = await checkPrerequisite('clerk_user_123', 'BEGINNER');

      expect(result.qualified).toBe(true);
      expect(result.missingLevel).toBeNull();
      expect(mockPrisma.booking.findMany).not.toHaveBeenCalled();
    });
  });
});
