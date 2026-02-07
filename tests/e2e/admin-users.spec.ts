import { expect, test } from '@playwright/test';

/**
 * Admin User Management E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the user management page and interactions.
 */

test.describe('Admin User Management - List View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display user list with correct columns', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    // Verify table headers (German)
    const headers = page.locator('[data-testid="user-list-header"]');
    await expect(headers).toContainText('Name');
    await expect(headers).toContainText('E-Mail');
    await expect(headers).toContainText('Rolle');
    await expect(headers).toContainText('Outperformer');
    await expect(headers).toContainText('Letzte Anmeldung');
    await expect(headers).toContainText('Aktionen');
  });

  test('should support pagination', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    // Pagination controls should be visible
    const pagination = page.locator('[data-testid="user-list-pagination"]');
    await expect(pagination).toBeVisible();

    // Should show page info
    await expect(pagination).toContainText(/Seite \d+ von \d+/);
  });

  test('should support search filtering', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    // Search input should be visible
    const searchInput = page.locator('[data-testid="user-search-input"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Suchen...');

    // Type search term
    await searchInput.fill('test@example.com');
    await page.keyboard.press('Enter');

    // URL should update with search param
    await expect(page).toHaveURL(/search=test/);
  });

  test('should support Outperformer filter', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    // Outperformer filter toggle should be visible
    const filterToggle = page.locator('[data-testid="outperformer-filter"]');
    await expect(filterToggle).toBeVisible();
    await expect(filterToggle).toContainText('Nur Outperformer');

    // Click to enable filter
    await filterToggle.click();

    // URL should update
    await expect(page).toHaveURL(/outperformerOnly=true/);
  });
});

test.describe('Admin User Management - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show action menu with view, role assign, delete options', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');
    await page.waitForSelector('[data-testid^="user-row-"]');

    // Click action button on first user
    await page.click('[data-testid^="user-row-"] [data-testid="action-menu-button"]', {
      timeout: 5000,
    });

    // Menu should show options
    const menu = page.locator('[data-testid="user-action-menu"]');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Anzeigen');
    await expect(menu).toContainText('Rolle zuweisen');
    await expect(menu).toContainText('Löschen');
  });

  test('should show confirmation dialog before deleting user', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');
    await page.waitForSelector('[data-testid^="user-row-"]');
    await page.click('[data-testid^="user-row-"] [data-testid="action-menu-button"]');

    // Click delete option
    await page.click('[data-testid="delete-user-action"]');

    // Confirmation dialog should appear
    const dialog = page.locator('[data-testid="delete-confirmation-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Benutzer löschen');
    await expect(dialog).toContainText('Bist du sicher');

    // Should have cancel and confirm buttons
    await expect(dialog.locator('button:has-text("Abbrechen")')).toBeVisible();
    await expect(dialog.locator('button:has-text("Löschen")')).toBeVisible();
  });

  test('should show role assignment dialog', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    // Open action menu
    await page.waitForSelector('[data-testid^="user-row-"]');
    await page.click('[data-testid^="user-row-"] [data-testid="action-menu-button"]');

    // Click role assign option
    await page.click('[data-testid="assign-role-action"]');

    // Role dialog should appear
    const dialog = page.locator('[data-testid="role-assignment-dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Rolle zuweisen');

    // Should have admin toggle
    await expect(dialog.locator('[data-testid="admin-role-toggle"]')).toBeVisible();
  });
});

test.describe('Admin User Management - Outperformer Badge', () => {
  test('should display Outperformer badge for qualified users', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users?outperformerOnly=true');

    // Wait for filtered list
    await page.waitForSelector('[data-testid^="user-row-"]');

    // All visible rows should have Outperformer badge
    const rows = page.locator('[data-testid^="user-row-"]');
    const rowCount = await rows.count();
    const badges = page.locator('[data-testid="outperformer-badge"]');
    const badgeCount = await badges.count();

    // When filtering by outperformer, each row should have a badge
    expect(rowCount).toBeGreaterThan(0);
    expect(badgeCount).toBe(rowCount);
  });
});

test.describe('Admin User Management - Breadcrumb', () => {
  test('should display correct breadcrumb path', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/users');

    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Check hierarchy
    await expect(breadcrumb.locator('a').first()).toContainText('Admin Dashboard');
    await expect(breadcrumb).toContainText('Benutzer');
  });
});
