import { expect, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { gotoStable } from './helpers/nav';

/**
 * Admin Authorization E2E
 *
 * Isolates admin role and role-escalation navigation checks so the admin
 * project can run them without mixing them into the authenticated user slice.
 */

test.describe('Admin Role Authorization Contract', () => {
  test('admin role should see all navigation sections', async ({ page }) => {
    await seedMockClerkSession(page, 'admin');
    await gotoStable(page, '/admin', { waitForTestId: 'admin-dashboard-grid' });

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('[data-testid="admin-dashboard-grid"]')).toBeVisible();
  });

  test('should update navigation when role changes', async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    });
    const page = await context.newPage();

    try {
      await seedMockClerkSession(page, 'user');
      await gotoStable(page, '/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
      await gotoStable(page, '/admin');
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

      await seedMockClerkSession(page, 'admin');
      await gotoStable(page, '/admin', {
        waitForTestId: 'admin-dashboard-grid',
      });
      await expect(page).toHaveURL(/\/admin$/);
    } finally {
      await context.close();
    }
  });

  test('should render the admin dashboard grid for admin role', async ({
    page,
  }) => {
    await seedMockClerkSession(page, 'admin');
    await gotoStable(page, '/admin', {
      waitForTestId: 'admin-dashboard-grid',
    });

    await expect(
      page.locator('[data-testid="admin-dashboard-grid"]')
    ).toBeVisible();
  });
});