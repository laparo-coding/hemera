import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockPrisma = {
  course: {
    findMany: jest.fn(),
  },
};

const mockLogError = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/errors', () => {
  const actual = jest.requireActual('@/lib/errors');
  return {
    ...actual,
    logError: (...args: unknown[]) => mockLogError(...args),
  };
});

import { getFeaturedCourses } from '@/lib/api/courses';
import { DatabaseConnectionError } from '@/lib/errors';

describe('Course API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeaturedCourses', () => {
    it('reads featured courses from the database query only', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Grundkurs',
          description: 'Beschreibung',
          teaser: 'Teaser',
          slug: 'grundkurs',
          price: 30000,
          currency: 'EUR',
          capacity: 6,
          startDate: new Date('2026-06-19T00:00:00Z'),
          startTime: new Date('2026-06-19T08:00:00Z'),
          endTime: new Date('2026-06-19T18:15:00Z'),
          isPublished: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-02T00:00:00Z'),
          level: 'BEGINNER',
          thumbnailUrl: null,
          location: {
            id: 'location-1',
            name: 'Gartenhotel Fette Henne',
            slug: 'gartenhotel-fette-henne',
            city: 'Erkrath',
          },
        },
      ]);

      const result = await getFeaturedCourses(2);

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPublished: true,
            isNonPublic: false,
          },
          take: 2,
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        slug: 'grundkurs',
        location: {
          slug: 'gartenhotel-fette-henne',
        },
      });
    });

    it('rethrows database failures as DatabaseConnectionError', async () => {
      const dbError = new Error('database offline');
      mockPrisma.course.findMany.mockRejectedValue(dbError);

      const result = getFeaturedCourses();

      await expect(result).rejects.toBeInstanceOf(DatabaseConnectionError);
      expect(mockLogError).toHaveBeenCalledWith(dbError, {
        operation: 'getFeaturedCourses',
        limit: 3,
      });
    });
  });
});