jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
  },
}));

describe('Course API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useRealTimers();
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  it('returns featured courses when the query succeeds', async () => {
    const { prisma } = await import('@/lib/db/prisma');
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'course-1',
        title: 'Testkurs',
        description: 'Beschreibung',
        teaser: 'Teaser',
        slug: 'testkurs',
        price: 499,
        currency: 'EUR',
        capacity: 10,
        startDate: null,
        startTime: null,
        endTime: null,
        isPublished: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        level: 'BEGINNER',
        thumbnailUrl: null,
        location: null,
      },
    ]);

    const { getFeaturedCourses } = await import('@/lib/api/courses');

    await expect(getFeaturedCourses(1)).resolves.toEqual([
      expect.objectContaining({
        id: 'course-1',
        title: 'Testkurs',
        slug: 'testkurs',
        currency: 'EUR',
      }),
    ]);
  });

  it('returns an empty array when the featured query times out', async () => {
    jest.useFakeTimers();

    const { prisma } = await import('@/lib/db/prisma');
    (prisma.course.findMany as jest.Mock).mockImplementation(
      () => new Promise(() => undefined)
    );

    const { FEATURED_COURSES_TIMEOUT_MS, getFeaturedCourses } = await import(
      '@/lib/api/courses'
    );

    const resultPromise = getFeaturedCourses(1);
    await jest.advanceTimersByTimeAsync(FEATURED_COURSES_TIMEOUT_MS);

    await expect(resultPromise).resolves.toEqual([]);
  });
});