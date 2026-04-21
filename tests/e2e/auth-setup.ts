import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
  const passwordInput = page
    .locator('input[name="password"]')
    .or(page.locator('input[type="password"]'));
  const submitButton = page
    .locator('button:visible')
    .filter({ hasText: /fortsetzen|anmelden/i })
    .first();

  if (!email || !password) {
    setup.skip(
      !email || !password,
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated tests'
    );
    return;
  }

  // Navigate to sign-in page
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  // Wait for Clerk's sign-in form to load
  await page.waitForSelector('[data-clerk-root]', { timeout: 15000 }).catch(() => {
    // Fallback for different Clerk versions
  });

  // Fill in email - Clerk uses identifier field
  const emailInput = page.locator('input[name="identifier"]').or(
    page.locator('input[type="email"]')
  );
  await emailInput.fill(email);

  // Some sign-in surfaces show the password field immediately, others only after the first submit.
  if (!(await passwordInput.first().isVisible())) {
    await submitButton.click();
    await passwordInput.first().waitFor({ timeout: 10000 });
  }

  await passwordInput.first().fill(password);

  // Submit the active sign-in action regardless of whether the UI labels it Continue or Sign in.
  await submitButton.click();

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
  await fs.mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
