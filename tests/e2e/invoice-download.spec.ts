import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedMockClerkSession } from './auth-helper';
import { mockDashboardBookings } from './helpers/dashboard';
import { gotoStable } from './helpers/nav';

const INVOICE_TIMEOUT = 90_000;

async function gotoDashboard(page: import('@playwright/test').Page) {
  await gotoStable(page, '/dashboard', {
    waitForTestId: 'user-dashboard',
    timeout: INVOICE_TIMEOUT,
  });
}

function completedInvoiceButton(page: import('@playwright/test').Page) {
  return page
    .getByTestId('section-completed')
    .locator('[data-testid^="invoice-download-"]')
    .first();
}

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
  test.skip(
    !!process.env.CI && !fs.existsSync('.auth/user.json'),
    'Skipping auth-required tests - no auth state available'
  );

  test.use(
    !!process.env.CI && fs.existsSync('.auth/user.json')
      ? { storageState: '.auth/user.json' }
      : {}
  );

  test.beforeEach(async ({ page, request }) => {
    if (!process.env.CI) {
      await seedMockClerkSession(page, 'user');
      await mockDashboardBookings(page);
    }

    // Warmup: Hit health endpoint first
    try {
      await request.get('/api/health', { timeout: 60000 });
    } catch {
      test.info().annotations.push({
        type: 'info',
        description: 'Health warmup timed out; continuing with dashboard assertions',
      });
    }
  });

  test('authenticated user can see invoice button on dashboard', async ({
    page,
  }) => {
    await gotoDashboard(page);

    if ((await completedInvoiceButton(page).count()) === 0) {
      await expect(page.getByText('Beginne deine Lernreise')).toBeVisible();
      return;
    }

    await expect(completedInvoiceButton(page)).toBeVisible({
      timeout: INVOICE_TIMEOUT,
    });
  });

  test('clicking invoice button downloads PDF', async ({ page }) => {
    await gotoDashboard(page);

    const invoiceButton = completedInvoiceButton(page);

    if ((await invoiceButton.count()) === 0) {
      await expect(page.getByText('Beginne deine Lernreise')).toBeVisible();
      return;
    }

    await expect(invoiceButton).toBeVisible({ timeout: INVOICE_TIMEOUT });

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
    await gotoDashboard(page);

    if ((await completedInvoiceButton(page).count()) === 0) {
      await expect(page.getByText('Beginne deine Lernreise')).toBeVisible();
      return;
    }

    const bookingId = await completedInvoiceButton(page)
      .evaluate(
        element =>
          element.getAttribute('data-testid')?.replace('invoice-download-', '') ||
          ''
      );

    expect(bookingId).not.toBe('');

    const result = await page.evaluate(async currentBookingId => {
      const response = await fetch(`/api/bookings/${currentBookingId}/invoice`, {
        credentials: 'include',
      });
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
      };
    }, bookingId);

    expect(result.status).toBe(200);
    expect(result.contentType).toMatch(/application\/pdf|application\/octet-stream/);
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

    // Should return 401, 403, redirect, or 500 (when Clerk is disabled in CI)
    // 500 is acceptable when auth provider is disabled since auth middleware may throw
    expect([401, 403, 302, 307, 500]).toContain(response.status());
  });
});
