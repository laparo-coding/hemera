import { test, expect } from '@playwright/test';
import { isEnvFlagEnabled } from '../../lib/utils/env-flags';
import { seedMockClerkSession } from './auth-helper';
import { waitForClientHydration } from './helpers/nav';

/**
 * Production Smoke Tests
 *
 * These tests run against the live production environment (hemera.academy)
 * and verify core functionality is working. They are READ-ONLY and should
 * never modify production data.
 *
 * Run: npx playwright test --project=production-smoke
 * Schedule: Daily at 6 AM UTC via GitHub Actions
 */
test.describe('Production Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');

    // Verify page loads
    expect(response?.status()).toBe(200);

    // Verify essential content is present
    await expect(page.locator('h1').first()).toBeVisible();

    // Verify navigation is rendered
    await expect(page.locator('nav').or(page.locator('header'))).toBeVisible();
  });

  test('course listing page loads', async ({ page }) => {
    const response = await page.goto('/academy');

    expect(response?.status()).toBe(200);

    // Verify any course-related content is visible (check one locator at a time)
    const courseHeading = page.getByRole('heading', { name: /kurse|academy|courses/i }).first();
    const courseCard = page.locator('[data-testid="course-card"]').first();
    const courseText = page.getByText(/kurs|course/i).first();

    // At least one of these should be visible
    const hasHeading = await courseHeading.isVisible().catch(() => false);
    const hasCard = await courseCard.isVisible().catch(() => false);
    const hasText = await courseText.isVisible().catch(() => false);

    expect(hasHeading || hasCard || hasText).toBe(true);
  });

  test('sign-in page loads', async ({ page }) => {
    const response = await page.goto('/sign-in');

    expect(response?.status()).toBe(200);

    // Verify page has loaded with structural content
    await expect(page.getByTestId('sign-in-page')).toBeVisible({ timeout: 5000 });
    await waitForClientHydration(page);

    test.info().annotations.push({
      type: 'info',
      description: 'Sign-in page loaded (HTTP 200) - page structure verified',
    });
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const json = await response.json();
    // API responses are wrapped: { success: true, data: {...}, meta: {...} }
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('ok');
  });

  // Test with authentication if credentials are provided
  test('authenticated: dashboard accessible after login', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    test.skip(!email || !password, 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD required');

    if (
      isEnvFlagEnabled(process.env.NEXT_PUBLIC_DISABLE_CLERK) ||
      isEnvFlagEnabled(process.env.E2E_TEST)
    ) {
      await seedMockClerkSession(page, 'user');
    } else {
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      await waitForClientHydration(page);

      const emailInput = page.locator('input[name="identifier"]').or(
        page.locator('input[type="email"]')
      );
      const passwordInput = page
        .locator('input[name="password"]')
        .or(page.locator('input[type="password"]'));
      const submitButton = page
        .locator('button:visible')
        .filter({ hasText: /fortsetzen|anmelden/i })
        .first();

      await emailInput.fill(email!);

      if (!(await passwordInput.first().isVisible())) {
        await submitButton.click();
        await passwordInput.first().waitFor({ timeout: 10000 });
      }

      await passwordInput.fill(password!);
      await submitButton.click();

      await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 30000 });
    }

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify dashboard content
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible({
      timeout: 15000,
    });
  });
});
