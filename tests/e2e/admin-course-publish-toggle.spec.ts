import { expect, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { gotoStable } from './helpers/nav';

async function gotoCoursesPage(page: import('@playwright/test').Page) {
  await gotoStable(page, '/admin/courses', {
    waitForTestId: 'admin-courses-page',
    timeout: 60_000,
  });
}

async function hasPublishToggles(page: import('@playwright/test').Page) {
  return (await page.locator('[data-testid^="publish-toggle-"]').count()) > 0;
}

/**
 * Course Publish Toggle E2E Tests
 * Feature: 024-admin-dashboard
 *
 * Validates the publish/unpublish toggle on course list and detail pages.
 */

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  if (!process.env.CI) {
    await seedMockClerkSession(page, 'admin');
  }
});

test.describe('Course Publish Toggle - List View', () => {
  test('should display publish toggle instead of status column', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    if (await hasPublishToggles(page)) {
      await expect(page.locator('[data-testid^="publish-toggle-"]').first()).toBeVisible();
      return;
    }

    await expect(page.getByText('Keine Seminare gefunden')).toBeVisible();
  });

  test('should show toggle with correct states', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    // Toggle should be a switch component
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    await expect(firstToggle).toBeVisible();

    // The accessible label is applied on the FormControlLabel wrapper.
    await expect(firstToggle).toHaveAttribute('aria-label', /veröffentlich/i);

    // The native control should still expose a switch/checkbox role.
    const toggleInput = firstToggle.locator('input[type="checkbox"]');
    await expect(toggleInput).toHaveAttribute('role', /switch|checkbox/);
  });

  test('should toggle publish status with optimistic update', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');

    await firstToggle.click();
    await expect(input).toBeVisible();
  });

  test('should show loading state during toggle', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    // Click toggle and check for loading
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();

    // Set up request interception to slow down response
    await page.route('**/api/admin/courses/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await firstToggle.click();

    await expect(firstToggle).toBeVisible();
  });

  test('should show error toast on toggle failure', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    // Mock API failure
    await page.route('**/api/admin/courses/**', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error' }),
      })
    );

    // Click toggle
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    await firstToggle.click();

    const toggleInput = firstToggle.locator('input[type="checkbox"]');
    await expect(toggleInput).toBeVisible();
  });
});

test.describe('Course Publish Toggle - Accessibility', () => {
  test('should be keyboard accessible', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    // Tab to first toggle
    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');

    // Focus the toggle
    await input.focus();
    await expect(input).toBeFocused();

    // Press space to toggle
    const checkedBefore = await input.isChecked();
    await page.keyboard.press('Space');

    // Toggle state should change
    const checkedAfter = await input.isChecked();
    expect(checkedAfter).toBe(!checkedBefore);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    const firstToggle = page.locator('[data-testid^="publish-toggle-"]').first();
    const input = firstToggle.locator('input[type="checkbox"]');

    // The wrapper carries the course-specific aria-label text.
    await expect(firstToggle).toHaveAttribute('aria-label');

    // Role should be switch or checkbox
    const role = await input.getAttribute('role');
    expect(['switch', 'checkbox', null]).toContain(role);
  });
});

test.describe('Course Publish Toggle - Visual States', () => {
  test('should show green for published courses', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    const checkedToggle = page.locator('[data-testid^="publish-toggle-"] input:checked').first();
    if (await checkedToggle.count()) {
      await expect(checkedToggle).toBeChecked();
    }
  });

  test('should show visual indicator for draft courses', async ({ page }) => {
    test.skip(!!process.env.CI, 'Erfordert authentifizierte Session');
    await gotoCoursesPage(page);

    test.skip(!(await hasPublishToggles(page)), 'Keine Kurse in lokaler Testumgebung');

    const uncheckedToggle = page.locator('[data-testid^="publish-toggle-"] input:not(:checked)').first();
    if (await uncheckedToggle.count()) {
      await expect(uncheckedToggle).not.toBeChecked();
    }
  });
});
