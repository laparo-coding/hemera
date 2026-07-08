/**
 * Course Material HTML Content Upload E2E Tests
 * Feature: 030-extended-material-upload
 *
 * E2E tests for the material type selection screen with 3 tiles
 * and the HTML content file upload flow.
 */

import { expect, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { gotoStable } from './helpers/nav';

test.describe('Feature 030: Extended Material Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    if (!process.env.CI) {
      await seedMockClerkSession(page, 'admin');
    }
  });

  test('material type selection screen renders 3 tiles in 2-1 layout', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');

    // Wait for page to load
    await page.waitForSelector('text=Welche Art von Material');

    // Tile 1: "Ich möchte eine Inhaltsseite hinzufügen." (top-left)
    const uploadTile = page.getByText(
      'Ich möchte eine Inhaltsseite hinzufügen.'
    );
    await expect(uploadTile).toBeVisible();

    // Tile 2: "Ich möchte eine Inhaltsseite anlegen." (top-right)
    const editorTile = page.getByText(
      'Ich möchte eine Inhaltsseite anlegen.'
    );
    await expect(editorTile).toBeVisible();

    // Tile 3: "Ich möchte eine Steuerdatei hinzufügen." (bottom)
    const controlTile = page.getByText(
      'Ich möchte eine Steuerdatei hinzufügen.'
    );
    await expect(controlTile).toBeVisible();
  });

  test('clicking "hinzufügen" tile opens upload form', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    // Click the "hinzufügen" tile
    await page.getByText('Ich möchte eine Inhaltsseite hinzufügen.').click();

    // Verify upload form is displayed
    await expect(page.getByLabel('Titel')).toBeVisible();
    await expect(page.getByText('Datei auswählen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
  });

  test('upload form has title and file upload zone', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    await page.getByText('Ich möchte eine Inhaltsseite hinzufügen.').click();

    // Title field
    const titleField = page.getByLabel('Titel');
    await expect(titleField).toBeVisible();
    await expect(titleField).toHaveAttribute('required');

    // File upload zone (drag-and-drop area)
    const uploadZone = page.locator('[role="button"]').filter({
      hasText: /Datei|Upload|html/i,
    });
    await expect(uploadZone.first()).toBeVisible();
  });

  test('clicking "anlegen" tile opens SlideEditor (regression)', async ({
    page,
  }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    // Click the "anlegen" tile (existing editor)
    await page.getByText('Ich möchte eine Inhaltsseite anlegen.').click();

    // Verify SlideEditor or MaterialForm is displayed
    // The editor should show some form of content editing
    await expect(page.getByLabel('Titel')).toBeVisible();
  });

  test('tiles are keyboard-navigable', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    // Tab through the tiles
    await page.keyboard.press('Tab');

    // Focus should be on a tile (CardActionArea renders as button)
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Verify focus indicator is visible
    const focusVisible = page.locator(':focus-visible');
    await expect(focusVisible).toBeVisible();
  });

  test('upload form validates required title field', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    await page.getByText('Ich möchte eine Inhaltsseite hinzufügen.').click();

    // Try to submit without title
    await page.getByRole('button', { name: 'Speichern' }).click();

    // Should show validation error
    await expect(page.getByText('Titel ist erforderlich')).toBeVisible();
  });

  test('upload form validates file is required', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    await page.getByText('Ich möchte eine Inhaltsseite hinzufügen.').click();

    // Enter title but no file
    await page.getByLabel('Titel').fill('Test Material');

    // Try to submit
    await page.getByRole('button', { name: 'Speichern' }).click();

    // Should show validation error for missing file
    await expect(page.getByText(/.html-Datei ist erforderlich/)).toBeVisible();
  });

  test('cancel button returns to material list', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session');

    await gotoStable(page, '/admin/course-material/new');
    await page.waitForSelector('text=Welche Art von Material');

    await page.getByText('Ich möchte eine Inhaltsseite hinzufügen.').click();

    // Click cancel
    await page.getByRole('button', { name: 'Abbrechen' }).click();

    // Should navigate back to material list
    await page.waitForURL('**/admin/course-material', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/course-material$/);
  });
});
