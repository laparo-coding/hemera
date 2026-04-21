import { expect, test, type Page } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { gotoStable } from './helpers/nav';

const ADMIN_USERS_TIMEOUT = 60_000;

async function gotoAdminUsers(page: Page) {
  await gotoStable(page, '/admin/users', {
    waitForTestId: 'admin-users-page',
    timeout: ADMIN_USERS_TIMEOUT,
  });
}

async function waitForUserListReady(page: Page) {
  await page
    .locator('[data-testid="user-search-input"] input')
    .waitFor({ state: 'visible', timeout: ADMIN_USERS_TIMEOUT });
  await page
    .locator('[data-testid="outperformer-filter"]')
    .waitFor({ state: 'visible', timeout: ADMIN_USERS_TIMEOUT });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  if (!process.env.CI) {
    await seedMockClerkSession(page, 'admin');
  }
});

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
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

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
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

    // Pagination controls should be visible
    const pagination = page.locator('[data-testid="user-list-pagination"]');
    if (await pagination.isVisible()) {
      await expect(pagination).toContainText(/Seite \d+ von \d+/);
      return;
    }

    test.info().annotations.push({
      type: 'info',
      description: 'Keine Pagination sichtbar; aktuelle Datenmenge passt auf eine Seite',
    });
  });

  test('should support search filtering', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

    // Search input should be visible
    const searchInput = page.locator('[data-testid="user-search-input"] input');
    await expect(searchInput).toHaveAttribute('placeholder', 'Suchen...');

    // Type search term
    await searchInput.fill('test@example.com');
    await page.keyboard.press('Enter');

    // URL should update with search param
    await expect(page).toHaveURL(/search=test/);
  });

  test('should support Outperformer filter', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

    // Outperformer filter toggle should be visible
    const filterToggle = page.locator('[data-testid="outperformer-filter"]');
    await expect(filterToggle).toContainText('Nur Outperformer');

    await filterToggle.click();

    // URL should update
    await expect(page).toHaveURL(/outperformerOnly=true/, {
      timeout: ADMIN_USERS_TIMEOUT,
    });
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
    await gotoAdminUsers(page);
    await waitForUserListReady(page);
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
    await expect(menu).toContainText('Benutzer löschen');
  });

  test('should show confirmation dialog before deleting user', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoAdminUsers(page);
    await waitForUserListReady(page);
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
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

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
    await page.goto('/admin/users?outperformerOnly=true', {
      waitUntil: 'domcontentloaded',
    });
    await page
      .getByTestId('admin-users-page')
      .waitFor({ state: 'visible', timeout: ADMIN_USERS_TIMEOUT });

    // All visible rows should have Outperformer badge
    const rows = page.locator('[data-testid^="user-row-"]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().waitFor({ state: 'attached', timeout: 5000 });
    }

    const badges = page.locator('[data-testid="outperformer-badge"]');
    const badgeCount = await badges.count();

    if (rowCount === 0) {
      test.info().annotations.push({
        type: 'info',
        description: 'Kein Outperformer-Datensatz in aktueller Testumgebung sichtbar',
      });
      return;
    }

    // When filtering by outperformer, each row should have a badge
    expect(badgeCount).toBe(rowCount);
  });
});

test.describe('Admin User Management - Breadcrumb', () => {
  test('should display correct breadcrumb path', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoAdminUsers(page);
    await waitForUserListReady(page);

    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Check hierarchy
    await expect(breadcrumb.locator('a').first()).toContainText('Admin Dashboard');
    await expect(breadcrumb).toContainText('Benutzer');
  });
});
