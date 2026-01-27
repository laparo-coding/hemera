import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

/**
 * Playwright auth setup - Logs in via Clerk and saves browser state
 *
 * This runs before tests that require authentication (chromium-auth project).
 * The resulting storage state is reused across all authenticated tests.
 *
 * Required env vars:
 * - E2E_TEST_EMAIL: Test user email (Clerk test user)
 * - E2E_TEST_PASSWORD: Test user password
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    setup.skip(
      !email || !password,
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated tests'
    );
    return;
  }

  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Wait for Clerk's sign-in form to load
  await page.waitForSelector('[data-clerk-root]', { timeout: 15000 }).catch(() => {
    // Fallback for different Clerk versions
  });

  // Fill in email - Clerk uses identifier field
  const emailInput = page.locator('input[name="identifier"]').or(
    page.locator('input[type="email"]')
  );
  await emailInput.fill(email);

  // Click continue button (Clerk two-step flow)
  const continueButton = page.getByRole('button', { name: /weiter|continue/i });
  await continueButton.click();

  // Wait for password field
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ timeout: 10000 });
  await passwordInput.fill(password);

  // Submit login
  const signInButton = page.getByRole('button', { name: /anmelden|sign in/i });
  await signInButton.click();

  // Wait for successful redirect to dashboard or home
  await expect(page).toHaveURL(/\/(dashboard|$)/, { timeout: 30000 });

  // Verify user is logged in by checking for user button or dashboard content
  await expect(
    page.getByRole('button', { name: /profil|user|account/i }).or(
      page.locator('[data-testid="user-button"]')
    ).or(
      page.getByText(/willkommen|meine kurse|dashboard/i).first()
    )
  ).toBeVisible({ timeout: 10000 });

  // Save auth state to file
  await page.context().storageState({ path: authFile });
});
