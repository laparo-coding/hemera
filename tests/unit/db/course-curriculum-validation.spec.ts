/**
 * Tests for curriculum validation in the database layer
 *
 * Ensures that createCourse and updateCourse validate curriculum
 * using Zod schema before persisting to the database.
 *
 * Also verifies that detailed Zod validation errors are logged server-side
 * via reportError() for admin diagnostics while sanitized errors are thrown.
 */

import { CurriculumValidationError } from '../../../lib/errors/domain';

// Mock reportError before importing courses module
jest.mock('../../../lib/monitoring/rollbar-official', () => ({
  reportError: jest.fn(),
  ErrorSeverity: {
    CRITICAL: 'critical',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug',
  },
}));

// We need to mock prisma before importing the module
jest.mock('../../../lib/db/prisma', () => ({
  prisma: {
    course: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
  },
}));

import { createCourse, updateCourse } from '../../../lib/db/admin/courses';
import { prisma } from '../../../lib/db/prisma';
import { reportError, ErrorSeverity } from '../../../lib/monitoring/rollbar-official';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockReportError = reportError as jest.Mock;

describe('Course DB Layer - Curriculum Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    const validCourseData = {
      title: 'Test Course',
      description: 'A test course',
      price: 100,
      startDate: new Date('2026-02-01'),
      startTime: new Date('2026-02-01T09:00:00'),
      endTime: new Date('2026-02-01T17:00:00'),
      instructor: 'Dr. Test',
      level: 'BEGINNER' as const,
      capacity: 10,
    };

    it('should allow null curriculum', async () => {
      (mockPrisma.course.create as jest.Mock).mockResolvedValue({
        id: 'test-id',
        ...validCourseData,
        curriculum: null,
        _count: { bookings: 0 },
      });

      await expect(
        createCourse({ ...validCourseData, curriculum: null })
      ).resolves.toBeDefined();
    });

    it('should allow undefined curriculum', async () => {
      (mockPrisma.course.create as jest.Mock).mockResolvedValue({
        id: 'test-id',
        ...validCourseData,
        _count: { bookings: 0 },
      });

      await expect(createCourse(validCourseData)).resolves.toBeDefined();
    });

    it('should allow valid curriculum array', async () => {
      const validCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Module 1',
          topics: [{ id: 't-1', timeRange: '09:00-10:00', title: 'Topic 1' }],
        },
      ];

      (mockPrisma.course.create as jest.Mock).mockResolvedValue({
        id: 'test-id',
        ...validCourseData,
        curriculum: validCurriculum,
        _count: { bookings: 0 },
      });

      await expect(
        createCourse({ ...validCourseData, curriculum: validCurriculum })
      ).resolves.toBeDefined();
    });

    it('should reject invalid curriculum structure', async () => {
      const invalidCurriculum = { invalid: 'structure' };

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);
    });

    it('should reject curriculum with missing required fields', async () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          // missing day, title, topics
        },
      ];

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);
    });

    it('should reject curriculum with invalid topic structure', async () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Module 1',
          topics: [{ invalid: 'topic' }],
        },
      ];

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);
    });
  });

  describe('updateCourse', () => {
    const updatedAt = new Date('2026-01-25T10:00:00');

    beforeEach(() => {
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        updatedAt,
      });
    });

    it('should allow null curriculum update', async () => {
      (mockPrisma.course.update as jest.Mock).mockResolvedValue({
        id: 'test-id',
        curriculum: null,
        _count: { bookings: 0 },
      });

      await expect(
        updateCourse('test-id', { curriculum: null, updatedAt })
      ).resolves.toBeDefined();
    });

    it('should allow valid curriculum update', async () => {
      const validCurriculum = [
        {
          id: 'mod-1',
          day: 1,
          title: 'Updated Module',
          topics: [{ id: 't-1', timeRange: '10:00-11:00', title: 'New Topic' }],
        },
      ];

      (mockPrisma.course.update as jest.Mock).mockResolvedValue({
        id: 'test-id',
        curriculum: validCurriculum,
        _count: { bookings: 0 },
      });

      await expect(
        updateCourse('test-id', { curriculum: validCurriculum, updatedAt })
      ).resolves.toBeDefined();
    });

    it('should reject invalid curriculum on update', async () => {
      const invalidCurriculum = 'not-an-array';

      await expect(
        updateCourse('test-id', {
          curriculum: invalidCurriculum as unknown as null,
          updatedAt,
        })
      ).rejects.toThrow(CurriculumValidationError);
    });

    it('should reject curriculum with negative day number', async () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: -1,
          title: 'Invalid Day',
          topics: [],
        },
      ];

      await expect(
        updateCourse('test-id', {
          curriculum: invalidCurriculum as unknown as null,
          updatedAt,
        })
      ).rejects.toThrow(CurriculumValidationError);
    });
  });

  describe('Curriculum validation error logging', () => {
    const validCourseData = {
      title: 'Test Course',
      description: 'A test course',
      price: 100,
      startDate: new Date('2026-02-01'),
      startTime: new Date('2026-02-01T09:00:00'),
      endTime: new Date('2026-02-01T17:00:00'),
      instructor: 'Dr. Test',
      level: 'BEGINNER' as const,
      capacity: 10,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (mockPrisma.course.findUnique as jest.Mock).mockResolvedValue({
        updatedAt: new Date('2026-01-25T10:00:00'),
      });
    });

    it('should log detailed Zod validation errors server-side when invalid curriculum provided', async () => {
      const invalidCurriculum = {
        invalid: 'structure',
      };

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);

      // Verify reportError was called with detailed validation info
      expect(mockReportError).toHaveBeenCalledWith(
        'Curriculum validation failed',
        expect.objectContaining({
          additionalData: expect.objectContaining({
            issueCount: expect.any(Number),
            issues: expect.arrayContaining([
              expect.objectContaining({
                path: expect.any(String),
                code: expect.any(String),
                message: expect.any(String),
              }),
            ]),
            receivedData: expect.any(String),
          }),
        }),
        ErrorSeverity.WARNING
      );
    });

    it('should log individual Zod issues with field paths and error codes', async () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          // missing required fields: day, title, topics
        },
      ];

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);

      expect(mockReportError).toHaveBeenCalled();
      const callArgs = mockReportError.mock.calls[0];
      const additionalData = callArgs[1].additionalData;

      // Verify issues contain path information for admin diagnosis
      expect(additionalData.issues).toBeDefined();
      expect(additionalData.issues.length).toBeGreaterThan(0);

      // Each issue should have path (e.g., "0.day", "0.title")
      additionalData.issues.forEach((issue: { path: string; code: string; message: string }) => {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('code');
        expect(issue).toHaveProperty('message');
      });
    });

    it('should throw sanitized error (with only count) that does not expose Zod details to client', async () => {
      const invalidCurriculum = [
        {
          id: 'mod-1',
          day: -1, // negative day is invalid
          title: '',  // empty title is invalid
          topics: 'not-array', // should be array
        },
      ];

      let caughtError: Error | undefined;
      try {
        await createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        });
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).toBeInstanceOf(CurriculumValidationError);

      // Verify the error message only exposes count, not schema internals
      const errorMessage = caughtError?.message || '';
      expect(errorMessage.length).toBeGreaterThan(0);

      // The error should NOT contain sensitive validation details
      // (client error should be sanitized - no raw Zod codes or received values)
      expect(errorMessage).not.toMatch(/invalid_type|required|zod|code.*received/i);
    });

    it('should log validation error with ErrorSeverity.WARNING', async () => {
      const invalidCurriculum = { notValid: true };

      await expect(
        createCourse({
          ...validCourseData,
          curriculum: invalidCurriculum as unknown as null,
        })
      ).rejects.toThrow(CurriculumValidationError);

      expect(mockReportError).toHaveBeenCalled();
      const callArgs = mockReportError.mock.calls[0];
      const severity = callArgs[2];

      expect(severity).toBe(ErrorSeverity.WARNING);
    });
  });
});
