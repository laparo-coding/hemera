import { test, expect } from '@playwright/test';

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

    // Skip Clerk form check if Clerk is disabled (CI environment)
    const clerkDisabled = process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';
    
    if (clerkDisabled) {
      // Just verify page loaded successfully
      await expect(page.locator('body')).toBeVisible();
      test.info().annotations.push({
        type: 'info',
        description: 'Clerk disabled - skipping sign-in form verification',
      });
    } else {
      // Verify Clerk sign-in form is rendered
      await expect(
        page.locator('[data-clerk-root]').or(
          page.locator('input[name="identifier"]')
        ).or(
          page.getByRole('button', { name: /anmelden|sign in|continue/i })
        )
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  // Test with authentication if credentials are provided
  test('authenticated: dashboard accessible after login', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    test.skip(!email || !password, 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD required');

    // Login
    await page.goto('/sign-in');

    // Fill email
    const emailInput = page.locator('input[name="identifier"]').or(
      page.locator('input[type="email"]')
    );
    await emailInput.fill(email!);

    // Continue
    await page.getByRole('button', { name: /weiter|continue/i }).click();

    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.waitFor({ timeout: 10000 });
    await passwordInput.fill(password!);

    // Sign in
    await page.getByRole('button', { name: /anmelden|sign in/i }).click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/(dashboard)?/, { timeout: 30000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify dashboard content
    await expect(page).toHaveURL(/dashboard/);
    await expect(
      page.getByRole('heading').first().or(
        page.getByText(/willkommen|dashboard|meine/i).first()
      )
    ).toBeVisible({ timeout: 15000 });
  });
});
