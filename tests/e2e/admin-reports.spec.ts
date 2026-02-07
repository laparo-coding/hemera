import { expect, test } from '@playwright/test';

/**
 * Admin Reports & Health Status E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the reports page and health status panel.
 */

test.describe('Admin Reports - Dashboard Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display reports page with all sections', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    // Main sections should be visible
    await expect(page.locator('[data-testid="reports-health-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-bookings-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-utilization-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-growth-section"]')).toBeVisible();
  });

  test('should display booking statistics', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const bookingsSection = page.locator('[data-testid="reports-bookings-section"]');
    await expect(bookingsSection).toBeVisible();

    // Should show German labels
    await expect(bookingsSection).toContainText('Buchungsstatistiken');
    await expect(bookingsSection).toContainText('Letzte 7 Tage');
    await expect(bookingsSection).toContainText('Letzte 30 Tage');
  });

  test('should display course utilization chart', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const utilizationSection = page.locator('[data-testid="reports-utilization-section"]');
    await expect(utilizationSection).toBeVisible();
    await expect(utilizationSection).toContainText('Kursauslastung');
  });

  test('should display user growth statistics', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const growthSection = page.locator('[data-testid="reports-growth-section"]');
    await expect(growthSection).toBeVisible();
    await expect(growthSection).toContainText('Benutzerwachstum');
    await expect(growthSection).toContainText('Outperformer');
  });
});

test.describe('Admin Reports - Health Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display system health panel', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const healthSection = page.locator('[data-testid="reports-health-section"]');
    await expect(healthSection).toBeVisible();
    await expect(healthSection).toContainText('Systemstatus');
  });

  test('should show individual service statuses in German', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const healthSection = page.locator('[data-testid="reports-health-section"]');

    // German service names
    await expect(healthSection).toContainText('Datenbank');
    await expect(healthSection).toContainText('Authentifizierung');
    await expect(healthSection).toContainText('Zahlungen');
    await expect(healthSection).toContainText('Fehlerüberwachung');
  });

  test('should show health status indicators', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    // Health status chips should be visible (data-testid="health-status-{service}")
    const healthSection = page.locator('[data-testid="reports-health-section"]');
    await expect(healthSection).toBeVisible();

    // At least one service status chip should exist
    const healthIndicators = healthSection.locator('[data-testid^="health-status-"]');
    await expect(healthIndicators.first()).toBeVisible();
  });

  test('should have manual refresh button', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    // Refresh button should be visible
    const refreshButton = page.locator('[data-testid="health-refresh-button"]');
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toContainText('Aktualisieren');
  });

  test('should refresh health status on button click', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    // Click refresh
    const refreshButton = page.locator('[data-testid="health-refresh-button"]');
    await refreshButton.click();

    // Should show loading state
    await expect(refreshButton).toBeDisabled();

    // Wait for refresh to complete
    await expect(refreshButton).toBeEnabled({ timeout: 5000 });
  });

  test('should display build information', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const healthSection = page.locator('[data-testid="reports-health-section"]');

    // Build info should be visible
    await expect(healthSection).toContainText(/Version/i);
    await expect(healthSection).toContainText(/Commit/i);
  });
});

test.describe('Admin Reports - Breadcrumb', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display correct breadcrumb path', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/reports');

    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    await expect(breadcrumb.locator('a').first()).toContainText('Admin Dashboard');
    await expect(breadcrumb).toContainText('Berichte & Analysen');
  });
});

test.describe('Admin Reports - Responsive', () => {
  test('should adapt layout for tablet viewport', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin/reports');

    // Sections should still be visible
    await expect(page.locator('[data-testid="reports-health-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-bookings-section"]')).toBeVisible();
  });

  test('should stack sections on mobile viewport', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/reports');

    // All sections should still be visible, just stacked
    await expect(page.locator('[data-testid="reports-health-section"]')).toBeVisible();
  });
});
