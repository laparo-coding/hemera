/**
 * Service API Route Handler Tests
 *
 * Tests that exercise the actual route handlers with mocked
 * Clerk auth, Prisma client, rate limiter, and audit logging.
 */

// ─── Mocks (must be before imports) ───────────────────────────────────────────

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
  clerkClient: jest.fn(),
}));

jest.mock('@/lib/auth/permissions', () => ({
  getUserRole: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    courseParticipation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(null),
  getRateLimitHeaders: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/monitoring/service-api-logger', () => ({
  logServiceApiCall: jest.fn(),
  extractIpAddress: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    info: jest.fn(),
    warn: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
  reportError: jest.fn(),
  ErrorSeverity: {
    CRITICAL: 'critical',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug',
  },
}));

jest.mock('@/lib/logging/audit', () => ({
  persistServiceApiLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/analytics/request-analytics', () => ({
  analytics: {
    trackRequest: jest.fn(),
    trackEvent: jest.fn(),
    trackPerformance: jest.fn(),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { describe, expect, it, beforeEach } from '@jest/globals';
import { auth } from '@clerk/nextjs/server';
import { getUserRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { NextRequest } from 'next/server';

// Route handlers
import { GET as getCoursesHandler } from '@/app/api/service/courses/route';
import { GET as getCourseByIdHandler } from '@/app/api/service/courses/[id]/route';
import { GET as getParticipationHandler } from '@/app/api/service/participations/[id]/route';
import { PUT as putResultHandler } from '@/app/api/service/participations/[id]/result/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetUserRole = getUserRole as jest.MockedFunction<typeof getUserRole>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

// Valid CUID test IDs (must match z.string().cuid() pattern)
const TEST_COURSE_ID = 'cm1234567890abcdefghij123';
const TEST_PARTICIPATION_ID = 'cm9876543210fedcba9876543';

function createRequest(
  url: string,
  options?: { method?: string; body?: unknown }
): NextRequest {
  const init: Record<string, unknown> = {
    method: options?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as never);
}

function setupAuth(userId: string | null, role: string = 'api-client') {
  if (userId) {
    mockAuth.mockResolvedValue({ userId } as never);
    mockGetUserRole.mockResolvedValue(role as never);
  } else {
    mockAuth.mockResolvedValue({ userId: null } as never);
    mockGetUserRole.mockResolvedValue('user' as never);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Service API Route Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/service/courses
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/service/courses', () => {
    const coursesUrl = 'http://localhost:3000/api/service/courses';

    it('should return 401 when not authenticated', async () => {
      setupAuth(null);
      const request = createRequest(coursesUrl);
      const response = await getCoursesHandler(request);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 for regular user role', async () => {
      setupAuth('user_123', 'user');
      const request = createRequest(coursesUrl);
      const response = await getCoursesHandler(request);
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return 200 with course list for api-client', async () => {
      setupAuth('svc_user_1', 'api-client');

      const mockCourses = [
        {
          id: TEST_COURSE_ID,
          title: 'Grundkurs',
          slug: 'grundkurs',
          level: 'BEGINNER',
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-03'),
          _count: { bookings: 2 },
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      (prisma.course.count as jest.Mock).mockResolvedValue(1);

      const request = createRequest(coursesUrl);
      const response = await getCoursesHandler(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data[0].id).toBe(TEST_COURSE_ID);
      expect(body.data[0].participantCount).toBe(2);
    });

    it('should pass query parameters as filters', async () => {
      setupAuth('svc_user_1', 'api-client');
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.course.count as jest.Mock).mockResolvedValue(0);

      const request = createRequest(
        `${coursesUrl}?level=ADVANCED&limit=10&offset=5`
      );
      await getCoursesHandler(request);

      expect(prisma.course.findMany).toHaveBeenCalled();
      const findManyCall = (prisma.course.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.level).toBe('ADVANCED');
      expect(findManyCall.take).toBe(10);
      expect(findManyCall.skip).toBe(5);
    });

    it('should return 200 for admin role', async () => {
      setupAuth('admin_user', 'admin');
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.course.count as jest.Mock).mockResolvedValue(0);

      const request = createRequest(coursesUrl);
      const response = await getCoursesHandler(request);
      expect(response.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/service/courses/[id]
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/service/courses/[id]', () => {
    const courseUrl = `http://localhost:3000/api/service/courses/${TEST_COURSE_ID}`;
    const routeParams = Promise.resolve({ id: TEST_COURSE_ID });

    it('should return 401 when not authenticated', async () => {
      setupAuth(null);
      const request = createRequest(courseUrl);
      const response = await getCourseByIdHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent course', async () => {
      setupAuth('svc_user_1', 'api-client');
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createRequest(courseUrl);
      const response = await getCourseByIdHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return course with participations', async () => {
      setupAuth('svc_user_1', 'api-client');

      const mockCourse = {
        id: TEST_COURSE_ID,
        title: 'Grundkurs',
        slug: 'grundkurs',
        level: 'BEGINNER',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-03'),
        bookings: [
          {
            id: 'b1',
            userId: 'u1',
            createdAt: new Date('2026-02-01'),
            participation: {
              id: TEST_PARTICIPATION_ID,
              status: 'PREPARATION',
              createdAt: new Date('2026-02-01'),
            },
          },
        ],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const request = createRequest(courseUrl);
      const response = await getCourseByIdHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(TEST_COURSE_ID);
      expect(body.data.participations).toHaveLength(1);
      expect(body.data.participations[0].userId).toBe('u1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/service/participations/[id]
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/service/participations/[id]', () => {
    const participationUrl =
      `http://localhost:3000/api/service/participations/${TEST_PARTICIPATION_ID}`;
    const routeParams = Promise.resolve({ id: TEST_PARTICIPATION_ID });

    it('should return 401 when not authenticated', async () => {
      setupAuth(null);
      const request = createRequest(participationUrl);
      const response = await getParticipationHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(401);
    });

    it('should return 404 when participation not found', async () => {
      setupAuth('svc_user_1', 'api-client');
      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const request = createRequest(participationUrl);
      const response = await getParticipationHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(404);
    });

    it('should return participation details', async () => {
      setupAuth('svc_user_1', 'api-client');

      const mockParticipation = {
        id: TEST_PARTICIPATION_ID,
        userId: 'u1',
        courseId: TEST_COURSE_ID,
        status: 'PREPARATION',
        preparationIntent: 'Improve skills',
        desiredResults: 'Be better',
        resultOutcome: null,
        resultNotes: null,
        resultCompletedAt: null,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
      };

      (prisma.courseParticipation.findUnique as jest.Mock).mockResolvedValue(
        mockParticipation
      );

      const request = createRequest(participationUrl);
      const response = await getParticipationHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(TEST_PARTICIPATION_ID);
      expect(body.data.status).toBe('PREPARATION');
      expect(body.data.preparationIntent).toBe('Improve skills');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PUT /api/service/participations/[id]/result
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PUT /api/service/participations/[id]/result', () => {
    const resultUrl =
      `http://localhost:3000/api/service/participations/${TEST_PARTICIPATION_ID}/result`;
    const routeParams = Promise.resolve({ id: TEST_PARTICIPATION_ID });

    it('should return 401 when not authenticated', async () => {
      setupAuth(null);
      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: { resultOutcome: 'test' },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(401);
    });

    it('should return 404 when participation not found', async () => {
      setupAuth('svc_user_1', 'api-client');
      // $transaction callback receives a tx proxy; simulate findUnique returning null
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          courseParticipation: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };
        return cb(tx);
      });

      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: { resultOutcome: 'test' },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid body', async () => {
      setupAuth('svc_user_1', 'api-client');

      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: { resultOutcome: 'A'.repeat(2001) },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(400);
    });

    it('should update result fields', async () => {
      setupAuth('svc_user_1', 'api-client');
      let capturedUpdateArgs: unknown;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          courseParticipation: {
            findUnique: jest.fn().mockResolvedValue({
              id: TEST_PARTICIPATION_ID,
              status: 'PREPARATION',
            }),
            update: jest.fn().mockImplementation((args: unknown) => {
              capturedUpdateArgs = args;
              return Promise.resolve({
                id: TEST_PARTICIPATION_ID,
                status: 'PREPARATION',
                resultOutcome: 'Great work',
                resultNotes: 'Excellent',
              });
            }),
          },
        };
        return cb(tx);
      });

      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: { resultOutcome: 'Great work', resultNotes: 'Excellent' },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(200);

      const updateCall = capturedUpdateArgs as { data: Record<string, unknown> };
      expect(updateCall.data.resultOutcome).toBe('Great work');
      expect(updateCall.data.resultNotes).toBe('Excellent');
    });

    it('should mark as COMPLETE when complete=true', async () => {
      setupAuth('svc_user_1', 'api-client');
      let capturedUpdateArgs: unknown;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          courseParticipation: {
            findUnique: jest.fn().mockResolvedValue({
              id: TEST_PARTICIPATION_ID,
              status: 'PREPARATION',
            }),
            update: jest.fn().mockImplementation((args: unknown) => {
              capturedUpdateArgs = args;
              return Promise.resolve({
                id: TEST_PARTICIPATION_ID,
                status: 'COMPLETE',
              });
            }),
          },
        };
        return cb(tx);
      });

      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: {
          resultOutcome: 'Done',
          complete: true,
        },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(200);

      const updateCall = capturedUpdateArgs as { data: Record<string, unknown> };
      expect(updateCall.data.status).toBe('COMPLETE');
      expect(updateCall.data.resultCompletedAt).toBeInstanceOf(Date);
    });

    it('should not set COMPLETE status when complete is not true', async () => {
      setupAuth('svc_user_1', 'api-client');
      let capturedUpdateArgs: unknown;
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          courseParticipation: {
            findUnique: jest.fn().mockResolvedValue({
              id: TEST_PARTICIPATION_ID,
              status: 'PREPARATION',
            }),
            update: jest.fn().mockImplementation((args: unknown) => {
              capturedUpdateArgs = args;
              return Promise.resolve({
                id: TEST_PARTICIPATION_ID,
                status: 'PREPARATION',
              });
            }),
          },
        };
        return cb(tx);
      });

      const request = createRequest(resultUrl, {
        method: 'PUT',
        body: { resultOutcome: 'Progress' },
      });
      const response = await putResultHandler(request, {
        params: routeParams,
      });
      expect(response.status).toBe(200);

      const updateCall = capturedUpdateArgs as { data: Record<string, unknown> };
      expect(updateCall.data.status).toBeUndefined();
      expect(updateCall.data.resultCompletedAt).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Rate Limiting
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Rate Limiting Integration', () => {
    it('should return rate limit response when limit exceeded', async () => {
      setupAuth('svc_user_1', 'api-client');

      // Simulate rate limiter returning a 429 response
      const rateLimitResponse = new Response(
        JSON.stringify({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests' },
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
      mockCheckRateLimit.mockResolvedValue(rateLimitResponse as never);

      const request = createRequest(
        'http://localhost:3000/api/service/courses'
      );
      const response = await getCoursesHandler(request);
      expect(response.status).toBe(429);
    });
  });
});
