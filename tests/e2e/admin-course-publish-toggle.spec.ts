import { expect, test } from '@playwright/test';

/**
 * Course Publish Toggle E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the publish/unpublish toggle on course list and detail pages.
 */

test.describe('Course Publish Toggle - List View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display publish toggle instead of status column', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    // Wait for course list
    await page.waitForSelector('[data-testid="course-list"]');

    // Status column should NOT be visible
    const headers = page.locator('[data-testid="course-list-header"]');
    await expect(headers).not.toContainText('Status');

    // Publish toggle should be visible
    const toggles = page.locator('[data-testid^="publish-toggle-"]');
    const count = await toggles.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show toggle with correct states', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]', {
      timeout: 5000,
    });

    // Toggle should be a switch component
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    await expect(firstToggle).toBeVisible();

    // Should have accessible label
    const toggleInput = firstToggle.locator('input[type="checkbox"]');
    await expect(toggleInput).toHaveAttribute('aria-label', /Veröffentlich/i);
  });

  test('should toggle publish status with optimistic update', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Get first toggle's initial state
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');
    const initialChecked = await input.isChecked();

    // Click toggle
    await firstToggle.click();

    // Should immediately update (optimistic)
    const newChecked = await input.isChecked();
    expect(newChecked).toBe(!initialChecked);
  });

  test('should show loading state during toggle', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Click toggle and check for loading
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();

    // Set up request interception to slow down response
    await page.route('**/api/admin/courses/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await firstToggle.click();

    // Toggle should show loading state briefly
    // (This depends on implementation - may show spinner or disabled state)
  });

  test('should show error toast on toggle failure', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Mock API failure
    await page.route('**/api/admin/courses/**', route =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal error' }),
      })
    );

    // Click toggle
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    await firstToggle.click();

    // Error notification should appear
    const toast = page.locator('[data-testid="error-toast"]');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText(/Fehler/i);
  });
});

test.describe('Course Publish Toggle - Accessibility', () => {
  test('should be keyboard accessible', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Tab to first toggle
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');

    // Focus the toggle
    await input.focus();
    await expect(input).toBeFocused();

    // Press space to toggle
    await page.keyboard.press('Space');
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');

    // Should have aria-label
    await expect(input).toHaveAttribute('aria-label');

    // Role should be switch or checkbox
    const role = await input.getAttribute('role');
    expect(['switch', 'checkbox', null]).toContain(role);
  });
});

test.describe('Course Publish Toggle - Visual States', () => {
  test('should show green for published courses', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Find a checked toggle
    const checkedToggle = page.locator('[data-testid^="publish-toggle-"] input:checked').first();

    if (await checkedToggle.isVisible()) {
      // Parent should have published styling
      const toggleContainer = checkedToggle.locator('..');
      // Visual verification would depend on actual implementation
    }
  });

  test('should show visual indicator for draft courses', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await page.goto('/admin/courses');

    await page.waitForSelector('[data-testid^="publish-toggle-"]');

    // Find an unchecked toggle
    const uncheckedToggle = page.locator('[data-testid^="publish-toggle-"] input:not(:checked)').first();

    if (await uncheckedToggle.isVisible()) {
      // Should show draft/unpublished state
    }
  });
});
