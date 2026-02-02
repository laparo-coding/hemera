/**
 * E2E Test: Admin Course Delete with Protection
 *
 * Tests delete protection and enrollment transfer:
 * - Delete course without enrollments (success)
 * - Block delete with enrollments (protection)
 * - Display enrolled students list
 * - Transfer enrollments to another course
 * - Delete after successful transfer
 *
 * NOTE: Requires Clerk authentication - skipped in CI.
 */

import { expect, test } from '@playwright/test';
import { prisma } from '../../lib/db/prisma';
import { AuthHelper } from './auth-helper';

// Skip in CI - requires Clerk authentication
const skipInCI = !!process.env.CI || process.env.E2E_TEST === '1';

test.describe('Admin Course Delete Protection E2E', () => {
  test.skip(() => skipInCI, 'Requires Clerk authentication - skipped in CI');

  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.prepareCleanAuthState();
    // Login as admin
    await authHelper.signIn(
      'e2e.admin@example.com',
      'E2ETestPassword2024!SecureForTesting'
    );
  });

  test.afterEach(async () => {
    // Cleanup all test courses and bookings
    await prisma.booking.deleteMany({
      where: {
        course: {
          title: {
            contains: '[E2E-DELETE-TEST]',
          },
        },
      },
    });

    await prisma.course.deleteMany({
      where: {
        title: {
          contains: '[E2E-DELETE-TEST]',
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'e2e-delete-test',
        },
      },
    });
  });

  test('should successfully delete course without enrollments', async ({
    page,
  }) => {
    // Create course without enrollments
    const course = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Empty Course',
        description: 'Course with no enrollments',
        slug: `e2e-delete-empty-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });

    await page.goto('/admin/courses');

    // Find and click delete button for this course
    const courseRow = page.locator(`tr:has-text("${course.title}")`);
    await courseRow.getByTitle(/delete/i).click();

    // Should show delete confirmation
    await expect(page.getByText(/delete course/i)).toBeVisible();
    await expect(page.getByText(/no enrollments/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /delete course/i }).click();

    // Should redirect to courses list
    await expect(page).toHaveURL('/admin/courses', { timeout: 10000 });

    // Course should no longer appear
    await expect(
      page.getByText('[E2E-DELETE-TEST] Empty Course')
    ).not.toBeVisible();
  });

  test('should block delete when course has enrollments', async ({ page }) => {
    // Create course with enrollment
    const course = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Enrolled Course',
        description: 'Course with students enrolled',
        slug: `e2e-delete-enrolled-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });

    const user = await prisma.user.create({
      data: {
        id: `user_e2e_delete_student_${Date.now()}`,
        email: `e2e-delete-test-student-${Date.now()}@example.com`,
        name: 'E2E Test Student',
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

    await page.goto('/admin/courses');

    // Click delete button
    const courseRow = page.locator(`tr:has-text("${course.title}")`);
    await courseRow.getByTitle(/delete/i).click();

    // Should show protection message
    await expect(page.getByText(/cannot delete/i)).toBeVisible();
    await expect(page.getByText(/1 student.*enrolled/i)).toBeVisible();

    // Delete button should be disabled
    const deleteButton = page.getByRole('button', { name: /delete course/i });
    await expect(deleteButton).toBeDisabled();

    // Should show transfer option
    await expect(
      page.getByRole('button', { name: /transfer students/i })
    ).toBeVisible();
  });

  test('should display enrolled students list', async ({ page }) => {
    // Create course with multiple enrollments
    const course = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Course With Students',
        description: 'Course with multiple students',
        slug: `e2e-delete-students-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });

    // Create multiple users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: `user_e2e_student1_${Date.now()}`,
          email: `e2e-delete-test-student1-${Date.now()}@example.com`,
          name: 'Student One',
        },
      }),
      prisma.user.create({
        data: {
          id: `user_e2e_student2_${Date.now()}`,
          email: `e2e-delete-test-student2-${Date.now()}@example.com`,
          name: 'Student Two',
        },
      }),
    ]);

    // Create bookings
    await Promise.all(
      users.map(user =>
        prisma.booking.create({
          data: {
            courseId: course.id,
            userId: user.id,
            paymentStatus: 'CONFIRMED',
            amount: 9999,
          },
        })
      )
    );

    await page.goto('/admin/courses');

    // Click delete
    const courseRow = page.locator(`tr:has-text("${course.title}")`);
    await courseRow.getByTitle(/delete/i).click();

    // Should show enrolled students
    await expect(page.getByText(/2 students.*enrolled/i)).toBeVisible();
    await expect(page.getByText('Student One')).toBeVisible();
    await expect(page.getByText('Student Two')).toBeVisible();
  });

  test.skip('should allow delete after transferring enrollments', async ({
    page,
  }) => {
    // Note: This requires implementing the transfer flow UI
    // which involves selecting a target course
    // Skipped until transfer UI is implemented

    // Create source and target courses
    const sourceCourse = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Source Course',
        description: 'Course to transfer from',
        slug: `e2e-delete-source-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });

    const _targetCourse = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Target Course',
        description: 'Course to transfer to',
        slug: `e2e-delete-target-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
        capacity: 50,
      },
    });

    // Create enrollment
    const user = await prisma.user.create({
      data: {
        id: `user_e2e_transfer_${Date.now()}`,
        email: `e2e-delete-test-transfer-${Date.now()}@example.com`,
      },
    });

    await prisma.booking.create({
      data: {
        courseId: sourceCourse.id,
        userId: user.id,
        paymentStatus: 'CONFIRMED',
        amount: 9999,
      },
    });

    await page.goto('/admin/courses');

    // Click delete on source course
    const courseRow = page.locator(`tr:has-text("${sourceCourse.title}")`);
    await courseRow.getByTitle(/delete/i).click();

    // Click transfer button
    await page.getByRole('button', { name: /transfer students/i }).click();

    // Select target course
    // TODO: Implement transfer UI selection

    // After transfer, should be able to delete
    await page.getByRole('button', { name: /delete course/i }).click();

    await expect(page).toHaveURL('/admin/courses');
    await expect(
      page.getByText('[E2E-DELETE-TEST] Source Course')
    ).not.toBeVisible();
  });

  test('should cancel delete operation', async ({ page }) => {
    const course = await prisma.course.create({
      data: {
        title: '[E2E-DELETE-TEST] Cancel Delete',
        description: 'Test cancel delete',
        slug: `e2e-delete-cancel-${Date.now()}`,
        price: 9999,
        startTime: new Date(Date.now() + 86400000),
      },
    });

    await page.goto('/admin/courses');

    const courseRow = page.locator(`tr:has-text("${course.title}")`);
    await courseRow.getByTitle(/delete/i).click();

    // Cancel deletion
    await page.getByRole('button', { name: /cancel/i }).click();

    // Should return to courses list without deleting
    await expect(
      page.getByText('[E2E-DELETE-TEST] Cancel Delete')
    ).toBeVisible();
  });
});
