import { expect, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { clickAndWait, gotoStable } from './helpers/nav';

/**
 * Admin Dashboard E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the admin dashboard UI and navigation.
 */

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  if (!process.env.CI) {
    await seedMockClerkSession(page, 'admin');
  }
});

test.describe('Admin Dashboard - Layout & Navigation', () => {
  test('should display dashboard with 6 cards in 3-column grid', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    // Navigate to admin dashboard (will be redirected if not auth'd in non-CI)
    await page.goto('/admin');

    // Check for dashboard layout
    const dashboardGrid = page.locator('[data-testid="admin-dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();

    // Should have exactly 6 cards
    const cards = page.locator('[data-testid^="dashboard-card-"]');
    await expect(cards).toHaveCount(6);

    // Verify card titles are in German
    await expect(page.getByTestId('dashboard-card-users')).toContainText('Benutzer');
    await expect(page.getByTestId('dashboard-card-courses')).toContainText('Seminare');
    await expect(page.getByTestId('dashboard-card-course-material')).toContainText('Material');
    await expect(page.getByTestId('dashboard-card-locations')).toContainText('Veranstaltungsorte');
    await expect(page.getByTestId('dashboard-card-testimonials')).toContainText('Erfahrungsberichte');
    await expect(page.getByTestId('dashboard-card-reports')).toContainText('Berichte & Analysen');
  });

  test('should have consistent max-width of 1280px', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin');

    const container = page.locator('[data-testid="admin-page-container"]');
    const box = await container.boundingBox();

    if (box) {
      expect(box.width).toBeLessThanOrEqual(1280);
    }
  });

  test('should navigate to user management page', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin', {
      waitForTestId: 'admin-dashboard-grid',
    });

    // Click on user management card
    await clickAndWait(page, () => page.getByTestId('dashboard-card-users'), {
      expectUrl: /\/admin\/users/,
      waitForTestId: 'admin-users-page',
      timeout: 30_000,
    });

    // Verify breadcrumb navigation
    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Admin Dashboard');
    await expect(breadcrumb).toContainText('Benutzer');
  });

  test('should navigate to reports page', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin', {
      waitForTestId: 'admin-dashboard-grid',
    });

    await clickAndWait(page, () => page.getByTestId('dashboard-card-reports'), {
      expectUrl: /\/admin\/reports/,
      waitForTestId: 'admin-reports-page',
      timeout: 30_000,
    });

    // Verify breadcrumb
    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toContainText('Berichte & Analysen');
  });

  test('should not display footer on admin pages', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin', {
      waitForTestId: 'admin-dashboard-grid',
    });

    // Footer should not be visible
    await expect(page.locator('footer')).toHaveCount(0);
  });

  test('should not display welcome message', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin', {
      waitForTestId: 'admin-dashboard-grid',
    });

    // Admin dashboard should show generic intro text, not user-specific greeting.
    await expect(
      page.getByText('Willkommen im Administrationsbereich.')
    ).toBeVisible();
    await expect(page.getByText(/willkommen zurück/i)).not.toBeVisible();
  });
});

test.describe('Admin Dashboard - Breadcrumb Navigation', () => {
  test('should show correct breadcrumb hierarchy on subpages', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin/courses', {
      waitForTestId: 'admin-courses-page',
    });

    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // First item should link to dashboard
    const dashboardLink = breadcrumb.locator('a').first();
    await expect(dashboardLink).toContainText('Admin Dashboard');
    await expect(dashboardLink).toHaveAttribute('href', '/admin');

    // Current page should not be a link
    await expect(breadcrumb).toContainText('Seminare');
  });

  test('should navigate back to dashboard via breadcrumb', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoStable(page, '/admin/users', {
      waitForTestId: 'admin-users-page',
      timeout: 60_000,
    });

    // Click on dashboard breadcrumb
    await clickAndWait(
      page,
      () => page.locator('[data-testid="admin-breadcrumb"] a:has-text("Admin Dashboard")'),
      {
        expectUrl: /\/admin$/,
        waitForTestId: 'admin-dashboard-grid',
        timeout: 30_000,
      }
    );
  });
});

test.describe('Admin Dashboard - Responsive Layout', () => {
  test('should adapt grid for tablet viewport', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');

    // Grid should still be visible but adapt
    const dashboardGrid = page.locator('[data-testid="admin-dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();
  });

  test('should adapt grid for mobile viewport', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');

    // Cards should stack vertically
    const cards = page.locator('[data-testid^="dashboard-card-"]');
    await expect(cards).toHaveCount(6);
  });
});
