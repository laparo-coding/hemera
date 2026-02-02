/**
 * E2E Test: Admin Course Creation
 *
 * Tests the complete course creation flow including:
 * - Admin authentication
 * - Navigation to create page
 * - Form filling with all fields
 * - File upload for thumbnail
 * - Validation and submission
 * - Success verification
 *
 * NOTE: Requires Clerk authentication - skipped in CI.
 */

import { expect, test } from '@playwright/test';
import { prisma } from '../../lib/db/prisma';
import { AuthHelper } from './auth-helper';

// Skip in CI - requires Clerk authentication
const skipInCI = !!process.env.CI || process.env.E2E_TEST === '1';

test.describe('Admin Course Creation E2E', () => {
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
    // Cleanup test courses
    await prisma.course.deleteMany({
      where: {
        title: {
          contains: '[E2E-TEST]',
        },
      },
    });
  });

  test('should create a new course with all fields', async ({ page }) => {
    // Navigate to admin courses page
    await page.goto('/admin/courses');
    await expect(page.getByText('Course Management')).toBeVisible();

    // Click create button
    await page.getByRole('button', { name: /create new course/i }).click();
    await expect(page).toHaveURL('/admin/courses/new');

    // Fill in course details
    await page.getByLabel(/course title/i).fill('[E2E-TEST] New Test Course');
    await page
      .getByLabel(/description/i)
      .fill(
        'This is a test course created by E2E tests with detailed description.'
      );
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/capacity/i).fill('25');

    // Set start time (tomorrow at 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const startTimeValue = tomorrow.toISOString().slice(0, 16);
    await page.getByLabel(/start time/i).fill(startTimeValue);

    await page.getByLabel(/duration/i).fill('6');
    await page.getByLabel(/instructor/i).fill('E2E Test Instructor');

    // Select level
    await page.getByLabel(/level/i).click();
    await page.getByRole('option', { name: 'Intermediate' }).click();

    // Submit form
    await page.getByRole('button', { name: /create course/i }).click();

    // Wait for redirect to courses list
    await expect(page).toHaveURL('/admin/courses', { timeout: 10000 });

    // Verify course appears in list
    await expect(page.getByText('[E2E-TEST] New Test Course')).toBeVisible();
    await expect(page.getByText('E2E Test Instructor')).toBeVisible();
    await expect(page.getByText('INTERMEDIATE')).toBeVisible();
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/admin/courses/new');

    // Try to submit empty form
    await page.getByRole('button', { name: /create course/i }).click();

    // Should show validation errors
    await expect(
      page.getByText(/title must be at least 3 characters/i)
    ).toBeVisible();
    await expect(
      page.getByText(/description must be at least 10 characters/i)
    ).toBeVisible();
  });

  test('should validate future date for start time', async ({ page }) => {
    await page.goto('/admin/courses/new');

    // Fill form with past date
    await page.getByLabel(/course title/i).fill('[E2E-TEST] Past Date Course');
    await page
      .getByLabel(/description/i)
      .fill('Test course with past date validation.');
    await page.getByLabel(/price/i).fill('99.99');

    // Set start time to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastTimeValue = yesterday.toISOString().slice(0, 16);
    await page.getByLabel(/start time/i).fill(pastTimeValue);

    await page.getByLabel(/duration/i).fill('4');
    await page.getByLabel(/instructor/i).fill('Test Instructor');

    await page.getByRole('button', { name: /create course/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/start time must be a future date/i)
    ).toBeVisible();
  });

  test.skip('should upload thumbnail image', async ({ page }) => {
    // Note: File upload requires Vercel Blob setup in test environment
    // Skipped until test blob storage is configured

    await page.goto('/admin/courses/new');

    // Upload thumbnail
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-thumbnail.jpg');

    // Verify preview appears
    await expect(page.locator('img[alt*="preview"]')).toBeVisible();
  });

  test('should navigate back to list on cancel', async ({ page }) => {
    await page.goto('/admin/courses/new');

    // Click cancel button
    await page.getByRole('button', { name: /cancel/i }).click();

    // Should return to courses list
    await expect(page).toHaveURL('/admin/courses');
  });
});
