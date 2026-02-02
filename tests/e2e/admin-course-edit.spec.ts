/**
 * E2E Test: Admin Course Edit with Optimistic Locking
 *
 * Tests concurrent edit scenarios:
 * - Two users editing same course
 * - Optimistic locking conflict detection
 * - Proper error handling for stale data
 * - Successful edit after refresh
 *
 * NOTE: Requires Clerk authentication - skipped in CI.
 */

import { expect, test } from '@playwright/test';
import { prisma } from '../../lib/db/prisma';
import { AuthHelper } from './auth-helper';

// Skip in CI - requires Clerk authentication
const skipInCI = !!process.env.CI || process.env.E2E_TEST === '1';

test.describe('Admin Course Edit - Optimistic Locking E2E', () => {
  test.skip(() => skipInCI, 'Requires Clerk authentication - skipped in CI');

  let testCourseId: string;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.prepareCleanAuthState();

    // Create a test course
    const course = await prisma.course.create({
      data: {
        title: '[E2E-TEST] Edit Lock Course',
        description: 'Test course for optimistic locking',
        slug: `e2e-edit-lock-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });
    testCourseId = course.id;

    // Login as admin
    await authHelper.signIn(
      'e2e.admin@example.com',
      'E2ETestPassword2024!SecureForTesting'
    );
  });

  test.afterEach(async () => {
    // Cleanup
    if (testCourseId) {
      await prisma.course.delete({ where: { id: testCourseId } }).catch(() => {
        /* Ignore cleanup errors */
      });
    }
  });

  test('should prevent concurrent edits with optimistic locking', async ({
    page,
    context,
  }) => {
    // Open course edit in first tab
    await page.goto(`/admin/courses/${testCourseId}/edit`);
    await expect(page.getByLabel(/course title/i)).toBeVisible();

    // Open second tab with same course
    const page2 = await context.newPage();
    await page2.goto(`/admin/courses/${testCourseId}/edit`);
    await expect(page2.getByLabel(/course title/i)).toBeVisible();

    // Make edit in second tab and save
    await page2
      .getByLabel(/course title/i)
      .fill('[E2E-TEST] Edit Lock Course - Updated in Tab 2');
    await page2.getByRole('button', { name: /update course/i }).click();

    // Wait for success
    await expect(page2).toHaveURL('/admin/courses', { timeout: 10000 });

    // Try to save in first tab (should fail with conflict)
    await page
      .getByLabel(/course title/i)
      .fill('[E2E-TEST] Edit Lock Course - Updated in Tab 1');
    await page.getByRole('button', { name: /update course/i }).click();

    // Should show conflict error
    await expect(page.getByText(/modified by another user/i)).toBeVisible({
      timeout: 5000,
    });

    // URL should stay on edit page
    await expect(page).toHaveURL(`/admin/courses/${testCourseId}/edit`);

    await page2.close();
  });

  test('should successfully update after resolving conflict', async ({
    page,
  }) => {
    await page.goto(`/admin/courses/${testCourseId}/edit`);

    // Make a simple edit
    await page.getByLabel(/price/i).fill('149.99');
    await page.getByRole('button', { name: /update course/i }).click();

    // Should succeed
    await expect(page).toHaveURL('/admin/courses', { timeout: 10000 });

    // Verify update in database
    const updatedCourse = await prisma.course.findUnique({
      where: { id: testCourseId },
    });
    expect(updatedCourse?.price).toBe(14999);
  });

  test('should update only modified fields', async ({ page }) => {
    const originalCourse = await prisma.course.findUnique({
      where: { id: testCourseId },
    });

    await page.goto(`/admin/courses/${testCourseId}/edit`);

    // Only change price
    await page.getByLabel(/price/i).fill('199.99');
    await page.getByRole('button', { name: /update course/i }).click();

    await expect(page).toHaveURL('/admin/courses', { timeout: 10000 });

    // Verify only price changed
    const updatedCourse = await prisma.course.findUnique({
      where: { id: testCourseId },
    });
    expect(updatedCourse?.price).toBe(19999);
    expect(updatedCourse?.title).toBe(originalCourse?.title);
    expect(updatedCourse?.description).toBe(originalCourse?.description);
  });

  test('should prevent reducing capacity below enrollments', async ({
    page,
  }) => {
    // Create a booking for the course
    const user = await prisma.user.create({
      data: {
        id: `user_e2e_enrolled_${Date.now()}`,
        email: `e2e-enrolled-${Date.now()}@example.com`,
      },
    });

    await prisma.booking.create({
      data: {
        courseId: testCourseId,
        userId: user.id,
        paymentStatus: 'CONFIRMED',
        amount: 9999,
      },
    });

    await page.goto(`/admin/courses/${testCourseId}/edit`);

    // Try to set capacity to 0 (below enrollment count of 1)
    await page.getByLabel(/capacity/i).fill('0');
    await page.getByRole('button', { name: /update course/i }).click();

    // Should show error
    await expect(
      page.getByText(/cannot reduce capacity below current enrollment/i)
    ).toBeVisible({ timeout: 5000 });

    // Cleanup
    await prisma.booking.deleteMany({ where: { courseId: testCourseId } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
