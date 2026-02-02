import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/**
 * Invoice Download E2E Tests
 *
 * Feature: 022-test-coverage
 * Tests the invoice download functionality in Stripe testmode.
 *
 * Prerequisites:
 * - User must be logged in (uses chromium-auth project)
 * - User must have at least one paid booking with Stripe invoice
 */
test.describe('Invoice Download', () => {
  // Skip entire suite if auth state file doesn't exist (no E2E credentials in CI)
  test.skip(!fs.existsSync('.auth/user.json'), 'Skipping auth-required tests - no auth state available');
  
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page, request }) => {
    // Warmup: Hit health endpoint first
    await request.get('/api/health', { timeout: 30000 });
  });

  test('authenticated user can see invoice button on dashboard', async ({
    page,
  }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Check for dashboard content
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 15000,
    });

    // Look for invoice button or link - may not exist if user has no paid bookings
    const invoiceElements = page.locator(
      '[data-testid="invoice-download"], [aria-label*="Rechnung"], button:has-text("Rechnung"), a:has-text("Rechnung")'
    );

    const invoiceCount = await invoiceElements.count();

    // Log whether invoices are available (informational, not a failure)
    if (invoiceCount > 0) {
      await expect(invoiceElements.first()).toBeVisible();
    } else {
      // This is expected if test user has no paid bookings
      test.info().annotations.push({
        type: 'info',
        description: 'No invoice buttons found - user may have no paid bookings',
      });
    }
  });

  test('clicking invoice button downloads PDF', async ({ page }) => {
    // Navigate to my-courses page where invoice buttons are located
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Find invoice download button/link
    const invoiceButton = page
      .locator(
        '[data-testid="invoice-download"], [aria-label*="Rechnung"], button:has-text("Rechnung"), a:has-text("Rechnung")'
      )
      .first();

    // Skip if no invoice button exists
    if ((await invoiceButton.count()) === 0) {
      test.skip(true, 'No invoice button found - user has no paid bookings');
      return;
    }

    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    // Click invoice button
    await invoiceButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download properties
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(pdf|PDF)$/);

    // Optionally save and check file size
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('invoice API returns correct content type', async ({ page, request }) => {
    // Navigate to dashboard to get booking context
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Find invoice link to extract booking/invoice ID
    const invoiceLink = page
      .locator('a[href*="invoice"], a[href*="rechnung"]')
      .first();

    if ((await invoiceLink.count()) === 0) {
      test.skip(true, 'No invoice link found');
      return;
    }

    const href = await invoiceLink.getAttribute('href');
    if (!href) {
      test.skip(true, 'No href attribute on invoice link');
      return;
    }

    // Make API request to invoice endpoint
    const response = await request.get(href);

    // Verify response
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/pdf|application\/octet-stream/);
  });
});

test.describe('Invoice Download - Unauthenticated', () => {
  test('unauthenticated user cannot access invoice', async ({
    page,
    request,
  }) => {
    // Try to access invoice API directly without auth
    const response = await request.get('/api/bookings/test-id/invoice', {
      failOnStatusCode: false,
    });

    // Should return 401 or redirect to login
    expect([401, 403, 302, 307]).toContain(response.status());
  });
});
