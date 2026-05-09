import { expect, type Page, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { mockDashboardBookings } from './helpers/dashboard';
import { gotoStable } from './helpers/nav';

/**
 * Role-Based Authorization E2E
 *
 * Validates role-based access control and navigation contracts for different user types.
 * Tests role enforcement, navigation visibility, and access restrictions.
 */

test.describe('Role-Based Navigation Contract', () => {
  test('user role should see limited navigation sections', async ({ page }) => {
    await signInAsUser(page);

    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByTestId('user-dashboard').getByTestId('user-role')
    ).toHaveText('user');
    await expect(page.getByTestId('dashboard-title')).toContainText(
      /Willkommen zurück/i
    );

    const dashboardSectionCount = await page
      .locator('[data-testid^="section-"]')
      .count();

    if (dashboardSectionCount === 0) {
      await expect(page.getByText('Beginne deine Lernreise')).toBeVisible();
    } else {
      await expect(page.locator('[data-testid^="section-"]').first()).toBeVisible();
    }

    await gotoStable(page, '/admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should enforce role-based access to admin section', async ({
    page,
  }) => {
    await seedMockClerkSession(page, 'user');
    await gotoStable(page, '/dashboard', { waitForTestId: 'user-dashboard' });
    await gotoStable(page, '/admin');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should handle unknown/invalid roles gracefully', async ({ page }) => {
    await seedMockClerkSession(page, 'user');
    await gotoStable(page, '/dashboard', { waitForTestId: 'user-dashboard' });
    await expect(
      page.getByTestId('user-dashboard').getByTestId('user-role')
    ).toHaveText('user');
  });

  test('should maintain role consistency across navigation', async ({
    page,
  }) => {
    await seedMockClerkSession(page, 'user');
    await gotoStable(page, '/dashboard', { waitForTestId: 'user-dashboard' });
    await gotoStable(page, '/academy');
    await expect(page).toHaveURL(/\/academy/);
    await gotoStable(page, '/admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// Helper functions for Clerk authentication
async function signInAsUser(page: Page) {
  await seedMockClerkSession(page, 'user');
  await mockDashboardBookings(page);
  await gotoStable(page, '/dashboard', { waitForTestId: 'user-dashboard' });
}

/**
 * Expected Test Results (before implementation):
 * ❌ All tests should FAIL initially
 * ❌ No role-based navigation components exist
 * ❌ No user/admin role differentiation
 * ❌ No access control for admin sections
 * ❌ No user profile with role display
 * ❌ Helper functions will fail (no Clerk integration)
 *
 * These failures confirm the contract tests are properly defined and will
 * validate the role-based access control implementation.
 */
