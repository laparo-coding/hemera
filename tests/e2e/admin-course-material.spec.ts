import { expect, test } from '@playwright/test';

/**
 * Admin Course Material E2E Tests
 * Feature: 023-slide-editor, 024-admin-dashboard
 *
 * Validates that the admin course material page loads correctly
 * and handles API requests properly.
 */

test.describe('Admin Course Material Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('GET /api/admin/course-material - should require authentication', async ({
    request,
  }) => {
    test.skip(
      !!process.env.E2E_TEST || !!process.env.NEXT_PUBLIC_DISABLE_CLERK,
      'Mock-Auth-Umgebung — alle Requests sind authentifiziert'
    );

    const response = await request.get('/api/admin/course-material');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('unauthorized');
    expect(body.message).toContain('Authentifizierung');
  });

  test('should display course material page with table', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    // Navigate to course material page
    await page.goto('/admin/course-material');

    // Wait for page to load
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check that no error alert is visible
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|error/i });
    await expect(errorAlert).not.toBeVisible();

    // Check page title
    await expect(page.locator('[data-testid="admin-course-material-page"]')).toBeVisible();
    await expect(page.getByText('Seminarmaterial')).toBeVisible();

    // Check that the material table container is present
    const tableContainer = page.locator('table');
    await expect(tableContainer).toBeVisible();

    // Check for key table elements
    await expect(page.getByText('Titel')).toBeVisible();
    await expect(page.getByText('Kennung')).toBeVisible();
    await expect(page.getByText('Erstellt am')).toBeVisible();
    await expect(page.getByText('Aktualisiert am')).toBeVisible();
  });

  test('should have working search and refresh functionality', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check for search input field
    const searchInput = page.getByPlaceholder('Suchen nach Titel oder Kennung...');
    await expect(searchInput).toBeVisible();

    // Check for refresh button
    const refreshButton = page.locator('button[title="Aktualisieren"]');
    await expect(refreshButton).toBeVisible();

    // Check for "Neues Material" button
    const addButton = page.getByText('Neues Material');
    await expect(addButton).toBeVisible();
  });

  test('should display empty state message when no materials exist', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check if the table displays either empty message or has materials
    const emptyMessage = page.getByText(/Noch keine Seminarmaterialien vorhanden|Keine Materialien gefunden/);
    const tableRows = page.locator('table tbody tr');

    // Exactly one of empty message or table rows should be visible
    const isEmpty = await emptyMessage.isVisible();
    const rowCount = await tableRows.count();

    if (isEmpty) {
      expect(rowCount).toBe(0);
    } else {
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('API /api/admin/course-material should return correct structure', async ({
    request,
  }) => {
    const isMockAuth =
      !!process.env.E2E_TEST || !!process.env.NEXT_PUBLIC_DISABLE_CLERK;

    const response = await request.get('/api/admin/course-material', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (isMockAuth) {
      // Mock-Auth: Request ist automatisch authentifiziert
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('materials');
      expect(Array.isArray(body.materials)).toBe(true);

      if (body.materials.length > 0) {
        const material = body.materials[0];
        expect(material).toHaveProperty('id');
        expect(material).toHaveProperty('identifier');
        expect(material).toHaveProperty('title');
        expect(material).toHaveProperty('createdAt');
        expect(material).toHaveProperty('updatedAt');
      }
    } else {
      // Echte Auth: Request ohne Auth wird abgelehnt
      expect(response.status()).toBe(401);
    }
  });

  test('should navigate to material detail via table action', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check if there are any materials in the table
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0 && rowCount < 100) {
      // Get first row with actual material data (not empty state)
      const firstDataRow = page.locator('table tbody tr').first();

      // Check for action buttons
      const editButton = firstDataRow.locator('button[aria-label*="bearbeiten"]');
      const viewButton = firstDataRow.locator('button[aria-label*="ansehen"]');

      // Mindestens ein Action-Button sollte vorhanden sein
      const hasEdit = await editButton.isVisible();
      const hasView = await viewButton.isVisible();
      expect(hasEdit || hasView).toBe(true);

      if (hasEdit) {
        expect(await editButton.isEnabled()).toBe(true);
      }
      if (hasView) {
        expect(await viewButton.isEnabled()).toBe(true);
      }
    }
  });

  test('should handle breadcrumb navigation', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check for breadcrumb containing "Seminarmaterial"
    const breadcrumb = page.locator('[data-testid="admin-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(page.getByText('Seminarmaterial')).toBeVisible();
  });

  test('should validate table pagination controls', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check for pagination controls
    const pagination = page.locator('[role="navigation"]').filter({ hasText: /Zeilen pro Seite|page/ });

    // Pagination may or may not be visible depending on material count
    // Just verify it doesn't cause errors when present
    if (await pagination.isVisible()) {
      const rowsPerPageSelector = page.getByLabel(/Zeilen pro Seite/i);
      expect(await rowsPerPageSelector.isVisible()).toBe(true);
    }
  });

  test('should not show error on initial page load', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    // Intercept console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/admin/course-material');
    await page.locator('[data-testid="admin-course-material-page"]').waitFor();

    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('TypeError') ||
        msg.includes('ReferenceError') ||
        msg.includes('SyntaxError') ||
        msg.includes('RangeError'),
    );
    expect(criticalErrors).toHaveLength(0);

    // Verify error alert is not visible
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error/i });
    await expect(errorAlert).not.toBeVisible();
  });
});
