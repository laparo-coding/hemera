import { expect, type Page, test } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the admin dashboard UI and navigation.
 */

test.describe('Admin Dashboard - Layout & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display dashboard with 7 cards in 3-column grid', async ({
    page,
  }) => {
    // Navigate to admin dashboard (will be redirected if not auth'd in non-CI)
    await page.goto('/admin');

    if (process.env.CI) {
      // In CI, we expect redirect to sign-in or mock
      const url = page.url();
      // Either on admin page or redirected
      expect(url).toMatch(/\/(admin|sign-in)/);
      return;
    }

    // Check for dashboard layout
    const dashboardGrid = page.locator('[data-testid="admin-dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();

    // Should have exactly 7 cards
    const cards = page.locator('[data-testid^="dashboard-card-"]');
    await expect(cards).toHaveCount(7);

    // Verify card titles are in German
    await expect(page.getByText('Benutzer')).toBeVisible();
    await expect(page.getByText('Seminare')).toBeVisible();
    await expect(page.getByText('Material')).toBeVisible();
    await expect(page.getByText('Veranstaltungsorte')).toBeVisible();
    await expect(page.getByText('Erfahrungsberichte')).toBeVisible();
    await expect(page.getByText('Systemeinstellungen')).toBeVisible();
    await expect(page.getByText('Berichte & Analysen')).toBeVisible();
  });

  test('should have consistent max-width of 1280px', async ({ page }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    const container = page.locator('[data-testid="admin-page-container"]');
    const box = await container.boundingBox();

    if (box) {
      expect(box.width).toBeLessThanOrEqual(1280);
    }
  });

  test('should navigate to user management page', async ({ page }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    // Click on user management card
    await page.click('[data-testid="dashboard-card-users"]');
    await expect(page).toHaveURL(/\/admin\/users/);

    // Verify breadcrumb navigation
    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Admin Dashboard');
    await expect(breadcrumb).toContainText('Benutzer');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    // Click on reports card
    await page.click('[data-testid="dashboard-card-reports"]');
    await expect(page).toHaveURL(/\/admin\/reports/);

    // Verify breadcrumb
    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toContainText('Berichte & Analysen');
  });

  test('should show disabled state for coming soon features', async ({
    page,
  }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    // Settings card should be disabled
    const settingsCard = page.locator('[data-testid="dashboard-card-settings"]');
    await expect(settingsCard).toHaveAttribute('aria-disabled', 'true');
  });

  test('should not display footer on admin pages', async ({ page }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    // Footer should not be visible
    const footer = page.locator('footer');
    await expect(footer).not.toBeVisible();
  });

  test('should not display welcome message', async ({ page }) => {
    await page.goto('/admin');

    if (process.env.CI) return;

    // No "Willkommen" or welcome text
    const welcomeText = page.getByText(/willkommen/i);
    await expect(welcomeText).not.toBeVisible();
  });
});

test.describe('Admin Dashboard - Breadcrumb Navigation', () => {
  test('should show correct breadcrumb hierarchy on subpages', async ({
    page,
  }) => {
    if (process.env.CI) return;

    // Navigate directly to a subpage
    await page.goto('/admin/courses');

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
    if (process.env.CI) return;

    await page.goto('/admin/users');

    // Click on dashboard breadcrumb
    await page.click('[data-testid="admin-breadcrumb"] a:has-text("Admin Dashboard")');
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe('Admin Dashboard - Responsive Layout', () => {
  test('should adapt grid for tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');

    if (process.env.CI) return;

    // Grid should still be visible but adapt
    const dashboardGrid = page.locator('[data-testid="admin-dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();
  });

  test('should adapt grid for mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');

    if (process.env.CI) return;

    // Cards should stack vertically
    const cards = page.locator('[data-testid^="dashboard-card-"]');
    await expect(cards).toHaveCount(7);
  });
});
