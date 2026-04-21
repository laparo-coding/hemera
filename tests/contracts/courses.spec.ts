/**
 * Contract Tests for Admin Course Management API
 *
 * These tests validate the API contracts defined in:
 * specs/014-create-an-admin/contracts/api-contract.md
 *
 * Tests cover:
 * - Authentication & Authorization (admin role required)
 * - Request/Response schema validation
 * - Error handling and error codes
 * - Edge cases (duplicate titles, concurrent edits, enrollment protection)
 *
 * NOTE: These tests require a running Next.js server.
 * They will be skipped in CI environments where no server is available.
 */

import { execFileSync } from 'node:child_process';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { prisma } from '../../lib/db/prisma';
import { isCiEnvironment } from '../../lib/utils/env-flags';

// Check if server is available before running HTTP-based tests
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const isCI = isCiEnvironment();

function isServerAvailable(baseUrl: string): boolean {
  try {
    execFileSync(
      process.execPath,
      [
        '-e',
        `fetch(${JSON.stringify(baseUrl)}, { method: 'HEAD', redirect: 'manual' }).then(response => process.exit(response.status < 500 ? 0 : 1)).catch(() => process.exit(1));`,
      ],
      {
        stdio: 'ignore',
        timeout: 3000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

const hasServer = isCI ? false : isServerAvailable(BASE_URL);

if (!isCI && !hasServer) {
  // biome-ignore lint/suspicious/noConsole: helpful local test skip hint
  console.warn(
    `Skipping admin course HTTP contract tests because no server is reachable at ${BASE_URL}.`
  );
}

// Skip these tests in CI since they require a running server
const describeWithServer = isCI || !hasServer ? describe.skip : describe;

describeWithServer('Admin Course API - Contract Tests', () => {
  const API_BASE = `${BASE_URL}/api/admin/courses`;

  // Test data
  let _testCourseId: string;
  const _testEmail = 'admin-contract-test@example.com';

  /**
   * Helper to make authenticated admin requests
   * Note: These tests assume admin middleware is bypassed in test env
   * or that test database has proper Clerk user setup
   */
  async function apiRequest(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'hemera-e2e-role=admin',
        ...options.headers,
      },
    });
  }

  beforeAll(async () => {
    // Ensure test database is clean
    // First find all test courses
    const testCourses = await prisma.course.findMany({
      where: {
        title: {
          contains: '[CONTRACT-TEST]',
        },
      },
      select: { id: true },
    });

    // Delete bookings for these courses
    if (testCourses.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          courseId: {
            in: testCourses.map((c: { id: string }) => c.id),
          },
        },
      });
    }

    // Then delete the courses
    await prisma.course.deleteMany({
      where: {
        title: {
          contains: '[CONTRACT-TEST]',
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    // First find all test courses
    const testCourses = await prisma.course.findMany({
      where: {
        title: {
          contains: '[CONTRACT-TEST]',
        },
      },
      select: { id: true },
    });

    // Delete bookings for these courses
    if (testCourses.length > 0) {
      await prisma.booking.deleteMany({
        where: {
          courseId: {
            in: testCourses.map((c: { id: string }) => c.id),
          },
        },
      });
    }

    // Then delete the courses
    await prisma.course.deleteMany({
      where: {
        title: {
          contains: '[CONTRACT-TEST]',
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('Authentication & Authorization', () => {
    it.skip('should return 403 for non-admin user', async () => {
      // Note: This test requires Clerk auth setup with test users
      // Implementation requires proper test token generation
      // Skipped until Clerk test infrastructure is fully configured
    });

    it.skip('should return 401 for missing Clerk token', async () => {
      // Note: This test requires Clerk auth middleware to be active
      // Skipped until Clerk test infrastructure is fully configured
    });

    it('should allow authenticated requests to proceed', async () => {
      // Basic connectivity test
      const response = await apiRequest('');
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/admin/courses - List Courses', () => {
    beforeEach(async () => {
      // Create test courses with different start times
      const now = new Date();
      await prisma.course.createMany({
        data: [
          {
            title: '[CONTRACT-TEST] Course A',
            description: 'Test course A',
            slug: 'contract-test-course-a',
            price: 9999, // in cents
            startTime: new Date(now.getTime() + 86400000), // +1 day
            isPublished: true,
          },
          {
            title: '[CONTRACT-TEST] Course B',
            description: 'Test course B',
            slug: 'contract-test-course-b',
            price: 14999, // in cents
            startTime: new Date(now.getTime() + 172800000), // +2 days
            isPublished: false,
          },
        ],
      });
    });

    afterEach(async () => {
      await prisma.course.deleteMany({
        where: { title: { contains: '[CONTRACT-TEST]' } },
      });
    });

    it('should return array of courses sorted by startTime', async () => {
      const response = await apiRequest('');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // Find our test courses
      const testCourses = data.filter((c: any) =>
        c.title.includes('[CONTRACT-TEST]')
      );
      expect(testCourses.length).toBeGreaterThanOrEqual(2);

      // Verify sorting by startTime
      for (let i = 0; i < testCourses.length - 1; i++) {
        const current = new Date(testCourses[i].startTime);
        const next = new Date(testCourses[i + 1].startTime);
        expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
      }
    });

    it('should include enrollment count for each course', async () => {
      const response = await apiRequest('');
      expect(response.status).toBe(200);

      const data = await response.json();
      const testCourse = data.find(
        (c: any) => c.title === '[CONTRACT-TEST] Course A'
      );

      expect(testCourse).toBeDefined();
      expect(testCourse._count).toBeDefined();
      expect(typeof testCourse._count.bookings).toBe('number');
    });

    it('should filter by published status when query param provided', async () => {
      const response = await apiRequest('?published=true');
      expect(response.status).toBe(200);

      const data = await response.json();
      const testCourses = data.filter((c: any) =>
        c.title.includes('[CONTRACT-TEST]')
      );

      // Should only include published test course
      const publishedCourse = testCourses.find(
        (c: any) => c.title === '[CONTRACT-TEST] Course A'
      );
      expect(publishedCourse).toBeDefined();

      // Should not include unpublished test course
      const unpublishedCourse = testCourses.find(
        (c: any) => c.title === '[CONTRACT-TEST] Course B'
      );
      expect(unpublishedCourse).toBeUndefined();
    });

    it.skip('should return 500 with DB_QUERY_FAILED on database error', async () => {
      // Skipped: Requires mocking database failure
      // Complex to test without breaking other tests
    });
  });

  describe('GET /api/admin/courses/[id] - Get Course by ID', () => {
    let courseId: string;

    beforeEach(async () => {
      const course = await prisma.course.create({
        data: {
          title: '[CONTRACT-TEST] Single Course',
          description: 'Test single course retrieval',
          slug: `contract-test-single-${Date.now()}`,
          price: 9999,
          startTime: new Date(Date.now() + 86400000),
        },
      });
      courseId = course.id;
    });

    afterEach(async () => {
      await prisma.course.delete({ where: { id: courseId } }).catch(() => {
        /* Ignore cleanup errors */
      });
    });

    it('should return course details with enrollment count', async () => {
      const response = await apiRequest(`/${courseId}`);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(courseId);
      expect(result.data.title).toBe('[CONTRACT-TEST] Single Course');
      expect(result.data._count).toBeDefined();
      expect(typeof result.data._count.bookings).toBe('number');
    });

    it('should return 404 with COURSE_NOT_FOUND for invalid ID', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
      const response = await apiRequest(`/${fakeId}`);
      expect(response.status).toBe(404);

      const result = await response.json();
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('COURSE_NOT_FOUND');
    });
  });

  describe('POST /api/admin/courses - Create Course', () => {
    const validCourseData = {
      title: '[CONTRACT-TEST] New Course',
      description: 'Test course creation with all required fields',
      price: 99.99,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      duration: 4,
      instructor: 'Test Instructor',
      level: 'BEGINNER',
      capacity: 20,
    };

    afterEach(async () => {
      await prisma.course.deleteMany({
        where: { title: { contains: '[CONTRACT-TEST] New Course' } },
      });
    });

    it('should create course with valid data and return 201', async () => {
      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(validCourseData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(validCourseData.title);
      expect(result.slug).toBeDefined();
      expect(Number(result.price)).toBe(9999);

      // Cleanup
      _testCourseId = result.id;
    });

    it('should return 400 with VALIDATION_FAILED for invalid data', async () => {
      const invalidData = {
        ...validCourseData,
        price: -10, // Invalid negative price
      };

      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it('should validate title length (3-200 characters)', async () => {
      const shortTitle = {
        ...validCourseData,
        title: 'AB', // Too short
      };

      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(shortTitle),
      });

      expect(response.status).toBe(400);
    });

    it('should allow past date for startTime (admin can set any date)', async () => {
      const pastDate = {
        ...validCourseData,
        startTime: new Date(Date.now() - 86400000).toISOString(), // Past date
      };

      const response = await apiRequest('', {
        method: 'POST',
        body: JSON.stringify(pastDate),
      });

      // Past dates are allowed for admin course management (201 = Created)
      expect(response.status).toBe(201);
    });

    it.skip('should return 409 warning for duplicate title (non-blocking)', async () => {
      // Skipped: Duplicate title check is advisory, not enforced
      // Would require implementation in API route
    });
  });

  describe('PATCH /api/admin/courses/[id] - Update Course', () => {
    let courseId: string;
    let courseUpdatedAt: Date;

    beforeEach(async () => {
      const course = await prisma.course.create({
        data: {
          title: '[CONTRACT-TEST] Update Course',
          description: 'Test course for updates',
          slug: `contract-test-update-${Date.now()}`,
          price: 9999,
          startTime: new Date(Date.now() + 86400000),
        },
      });
      courseId = course.id;
      courseUpdatedAt = course.updatedAt;
    });

    afterEach(async () => {
      await prisma.course.delete({ where: { id: courseId } }).catch(() => {
        /* Ignore cleanup errors */
      });
    });

    it('should update course with valid data and return 200', async () => {
      const updateData = {
        title: '[CONTRACT-TEST] Updated Title',
        price: 149.99,
        updatedAt: courseUpdatedAt.toISOString(),
      };

      const response = await apiRequest(`/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data.title).toBe(updateData.title);
      expect(Number(result.data.price)).toBe(14999);
    });

    it('should return 409 with CONCURRENT_EDIT_CONFLICT for stale updatedAt', async () => {
      const staleUpdatedAt = new Date(courseUpdatedAt.getTime() - 1000);
      const updateData = {
        title: '[CONTRACT-TEST] Concurrent Update',
        updatedAt: staleUpdatedAt.toISOString(),
      };

      const response = await apiRequest(`/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(409);
      const result = await response.json();
      expect(result.error.code).toBe('CONCURRENT_EDIT_CONFLICT');
    });

    it('should return 400 with CAPACITY_BELOW_ENROLLMENTS when capacity < enrollments', async () => {
      // First create a booking
      const user = await prisma.user.create({
        data: {
          id: `user_test_${Date.now()}`,
          email: `test-${Date.now()}@example.com`,
        },
      });

      await prisma.booking.create({
        data: {
          courseId: courseId,
          userId: user.id,
          paymentStatus: 'CONFIRMED',
          amount: 9999,
        },
      });

      // Try to reduce capacity below enrollment count
      const updateData = {
        capacity: 0,
        updatedAt: courseUpdatedAt.toISOString(),
      };

      const response = await apiRequest(`/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('CAPACITY_BELOW_ENROLLMENTS');

      // Cleanup
      await prisma.booking.deleteMany({ where: { courseId } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should allow partial updates (only provided fields)', async () => {
      const originalCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      const partialUpdate = {
        price: 199.99,
        updatedAt: courseUpdatedAt.toISOString(),
      };

      const response = await apiRequest(`/${courseId}`, {
        method: 'PATCH',
        body: JSON.stringify(partialUpdate),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      // Price should be updated
      expect(Number(result.data.price)).toBe(19999);

      // Title should remain unchanged
      expect(result.data.title).toBe(originalCourse?.title);
    });
  });

  describe('DELETE /api/admin/courses/[id] - Delete Course', () => {
    it('should delete course and return 204 when no enrollments', async () => {
      const course = await prisma.course.create({
        data: {
          title: '[CONTRACT-TEST] Delete Course',
          description: 'Test course for deletion',
          slug: `contract-test-delete-${Date.now()}`,
          price: 9999,
          startTime: new Date(Date.now() + 86400000),
        },
      });

      const response = await apiRequest(`/${course.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);

      // Verify course is deleted
      const deletedCourse = await prisma.course.findUnique({
        where: { id: course.id },
      });
      expect(deletedCourse).toBeNull();
    });

    it('should return 409 with ACTIVE_ENROLLMENTS_EXIST when enrollments > 0', async () => {
      const course = await prisma.course.create({
        data: {
          title: '[CONTRACT-TEST] Delete Protected Course',
          description: 'Test course with enrollment',
          slug: `contract-test-delete-protected-${Date.now()}`,
          price: 9999,
          startTime: new Date(Date.now() + 86400000),
        },
      });

      const user = await prisma.user.create({
        data: {
          id: `user_enrolled_${Date.now()}`,
          email: `enrolled-${Date.now()}@example.com`,
        },
      });

      await prisma.booking.create({
        data: {
          courseId: course.id,
          userId: user.id,
          paymentStatus: 'CONFIRMED',
          amount: 9999,
        },
      });

      const response = await apiRequest(`/${course.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(409);
      const result = await response.json();
      expect(result.error.code).toBe('ACTIVE_ENROLLMENTS_EXIST');

      // Cleanup
      await prisma.booking.deleteMany({ where: { courseId: course.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should include enrolled students list in 409 error response', async () => {
      const course = await prisma.course.create({
        data: {
          title: '[CONTRACT-TEST] Delete With Students',
          description: 'Test course with student list',
          slug: `contract-test-delete-students-${Date.now()}`,
          price: 9999,
          startTime: new Date(Date.now() + 86400000),
        },
      });

      const user = await prisma.user.create({
        data: {
          id: `user_student_${Date.now()}`,
          email: `student-${Date.now()}@example.com`,
        },
      });

      await prisma.booking.create({
        data: {
          courseId: course.id,
          userId: user.id,
          paymentStatus: 'CONFIRMED',
          amount: 9999,
        },
      });

      const response = await apiRequest(`/${course.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      expect(result.error.details).toBeDefined();
      expect(result.error.details.enrolledStudents).toBeDefined();
      expect(Array.isArray(result.error.details.enrolledStudents)).toBe(true);

      // Cleanup
      await prisma.booking.deleteMany({ where: { courseId: course.id } });
      await prisma.course.delete({ where: { id: course.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 404 with COURSE_NOT_FOUND for invalid ID', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
      const response = await apiRequest(`/${fakeId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error.code).toBe('COURSE_NOT_FOUND');
    });
  });

  describe('POST /api/admin/courses/[id]/transfer-enrollments - Transfer Enrollments', () => {
    it.skip('should transfer enrollments to target course and return 200', async () => {
      // Note: Transfer endpoint implementation is in server actions
      // not exposed as direct API route in current implementation
      // This would require creating API route wrapper for server action
    });

    it.skip('should return 400 with INSUFFICIENT_CAPACITY when target full', async () => {
      // Note: Skipped - see above
    });

    it.skip('should return 404 with TARGET_COURSE_NOT_FOUND for invalid target', async () => {
      // Note: Skipped - see above
    });

    it.skip('should prevent transfer to same course', async () => {
      // Note: Skipped - see above
    });
  });

  describe('Error Response Schema Validation', () => {
    it('should match error schema for all error responses', async () => {
      // Test with 404 error
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
      const response = await apiRequest(`/${fakeId}`);
      expect(response.status).toBe(404);

      const result = await response.json();

      // Validate error response structure
      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(typeof result.error.code).toBe('string');
      expect(result.error.message).toBeDefined();
      expect(typeof result.error.message).toBe('string');

      // Optional fields
      if (result.error.details) {
        expect(typeof result.error.details).toBe('object');
      }
    });

    it.skip('should trigger Rollbar logging for 500 errors', async () => {
      // Skipped: Requires mocking database failure to trigger 500 error
      // and verifying Rollbar was called
      // Would need Rollbar test mode or spy implementation
    });
  });
});
