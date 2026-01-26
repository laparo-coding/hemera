/**
 * Tests for curriculum validation in the database layer
 *
 * Ensures that createCourse and updateCourse validate curriculum
 * using Zod schema before persisting to the database.
 */

import { ZodError } from 'zod';

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

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

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
      ).rejects.toThrow(ZodError);
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
      ).rejects.toThrow(ZodError);
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
      ).rejects.toThrow(ZodError);
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
      ).rejects.toThrow(ZodError);
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
      ).rejects.toThrow(ZodError);
    });
  });
});
