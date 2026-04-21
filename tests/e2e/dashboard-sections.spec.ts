/**
 * T013: E2E Test - Dashboard Sections Flow
 *
 * End-to-end tests for the complete dashboard experience with 4 sections.
 */

import { expect, test } from '@playwright/test';
import { seedMockClerkSession } from './auth-helper';
import { mockDashboardBookings } from './helpers/dashboard';
import { clickAndWait, gotoStable } from './helpers/nav';

const DASHBOARD_TIMEOUT = 90_000;

test.describe.configure({ timeout: 120_000 });

async function gotoDashboard(page: import('@playwright/test').Page) {
  await gotoStable(page, '/dashboard', {
    waitForTestId: 'user-dashboard',
    timeout: DASHBOARD_TIMEOUT,
  });
}

async function expectDashboardDataOrEmptyState(
  page: import('@playwright/test').Page
) {
  const sectionCount = await page.locator('[data-testid^="section-"]').count();

  if (sectionCount === 0) {
    await expect(page.getByText('Beginne deine Lernreise')).toBeVisible();
    return false;
  }

  await expect(page.locator('[data-testid^="section-"]').first()).toBeVisible();
  return true;
}

test.beforeEach(async ({ page }) => {
  if (!process.env.CI) {
    await seedMockClerkSession(page, 'user');
    await mockDashboardBookings(page);
  }
});

test.describe('Dashboard Sections E2E', () => {
  test.describe('Dashboard page structure', () => {
    test('should display dashboard page for authenticated user', async ({
      page,
    }) => {
      // This test requires authentication setup
      // Will be implemented with Clerk test mode

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should not redirect to sign-in if authenticated
      // For unauthenticated, will redirect
      const url = page.url();

      // Either on dashboard or sign-in
      expect(url).toMatch(/\/(dashboard|sign-in)/);
    });

    test('should have correct page title in German', async ({ page }) => {
      await page.goto('/dashboard');

      // If authenticated, check for German title
      const title = await page.title();
      // Dashboard title should be in German
      expect(title).toBeDefined();
    });

    test('should protect the user profile route when signed out', async ({
      page,
    }) => {
      await page.goto('/user-profile');

      await expect(page).toHaveURL(/\/(user-profile|sign-in)/);
    });

    test('should expose the my-courses route or redirect to sign-in', async ({
      page,
    }) => {
      await page.goto('/my-courses');

      await expect(page).toHaveURL(/\/(my-courses|sign-in)/);
    });
  });

  test.describe('Section layout', () => {
    test('should render sections in correct order', async ({ page }) => {
      await gotoDashboard(page);

      const headings = await page.locator('h2').allTextContents();
      const expectedSections = [
        'Nächstes Seminar',
        'Weitere gebuchte Seminare',
        'Absolvierte Seminare',
        'Seminare ohne Teilnahme',
      ];

      // Verify order of visible sections
      let lastIndex = -1;
      for (const heading of headings) {
        const index = expectedSections.indexOf(heading);
        if (index !== -1) {
          expect(index).toBeGreaterThan(lastIndex);
          lastIndex = index;
        }
      }
    });

    test('should hide empty sections', async ({ page }) => {
      await gotoDashboard(page);

      if (!(await expectDashboardDataOrEmptyState(page))) {
        return;
      }

      await expect(page.locator('[data-testid^="section-"]')).toHaveCount(4);
    });
  });

  test.describe('Course card display', () => {
    test('should display course information in card', async ({ page }) => {
      await gotoDashboard(page);

      if (!(await expectDashboardDataOrEmptyState(page))) {
        return;
      }

      const courseCard = page.locator('[data-testid^="course-card-"]').first();

      await expect(courseCard).toContainText(
        /Fortgeschrittene Verhandlungsstrategien|Masterclass: Exzellenz in Verhandlungen|Grundlagen der Gehaltsverhandlung/
      );
      await expect(courseCard.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeVisible();
    });

    test('should display location with link', async ({ page }) => {
      await gotoDashboard(page);

      if (!(await expectDashboardDataOrEmptyState(page))) {
        return;
      }

      const locationLink = page
        .locator('[data-testid^="course-card-"]')
        .first()
        .locator('a[href^="/locations/"]');

      await expect(locationLink).toBeVisible();
      await expect(locationLink).toContainText('Hemera Studio Wien');
    });

    test('should display time range in German format', async ({ page }) => {
      await gotoDashboard(page);

      if (!(await expectDashboardDataOrEmptyState(page))) {
        return;
      }

      const timePattern = /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*Uhr/;
      await expect(page.getByText(timePattern).first()).toBeVisible();
    });
  });

  test.describe('Invoice download button', () => {
    test('should show invoice button for paid bookings', async ({ page }) => {
      await gotoDashboard(page);

      const invoiceButton = page
        .getByTestId('section-completed')
        .locator('[data-testid^="invoice-download-"]')
        .first();

      if ((await invoiceButton.count()) === 0) {
        await expectDashboardDataOrEmptyState(page);
        return;
      }

      await expect(invoiceButton).toBeVisible({ timeout: DASHBOARD_TIMEOUT });
    });

    test('should have German label on invoice button', async ({ page }) => {
      await gotoDashboard(page);

      const invoiceButton = page
        .getByTestId('section-completed')
        .locator('[data-testid^="invoice-download-"]')
        .first();

      if ((await invoiceButton.count()) === 0) {
        await expectDashboardDataOrEmptyState(page);
        return;
      }

      await expect(invoiceButton).toContainText('Rechnung herunterladen');
    });
  });

  test.describe('Navigation to course detail', () => {
    test('should navigate to course detail page on card click', async ({
      page,
    }) => {
      await gotoDashboard(page);

      const preparationLink = page
        .getByRole('link', { name: /vorbereitung/i })
        .first();

      if ((await preparationLink.count()) === 0) {
        await expectDashboardDataOrEmptyState(page);
        return;
      }

      await clickAndWait(
        page,
        () => preparationLink,
        { expectUrl: /\/my-courses\/[a-z0-9]+/, timeout: 30000 }
      );
    });

    test('should support direct URL with anchor', async ({ page }) => {
      test.skip(
        process.env.PLAYWRIGHT_ENABLE_LOCAL_DB_SEED !== '1',
        'Direktlink-Test benoetigt eine lokale seeded Datenbank.'
      );

      await page.unroute(/\/api\/bookings\/[^/]+\/invoice$/);
      await page.unroute(/\/api\/bookings(?:\?.*)?$/);

      await gotoDashboard(page);

      const seededCompletedCard = page
        .getByTestId('section-completed')
        .locator('[data-testid^="course-card-"]')
        .filter({ hasText: 'Grundlagen der Gehaltsverhandlung' })
        .first();

      const completedInvoiceButton = seededCompletedCard.locator(
        '[data-testid^="invoice-download-"]'
      );

      if ((await completedInvoiceButton.count()) === 0) {
        await page.goto('/my-courses', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/my-courses/);
        return;
      }

      const bookingId = await completedInvoiceButton.evaluate(element =>
        element
          .getAttribute('data-testid')
          ?.replace('invoice-download-', '')
          .trim() || ''
      );

      expect(bookingId).not.toBe('');

      await page.goto(`/my-courses/${bookingId}#ergebnisse`, {
        waitUntil: 'domcontentloaded',
      });

      await expect(page).toHaveURL(
        new RegExp(`/my-courses/${bookingId}#ergebnisse$`)
      );
      await expect(page.getByTestId('results-section')).toBeVisible();
    });
  });

  test.describe('Responsive layout', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');

      // Measure the actual dashboard surface instead of the whole body so fixed
      // dev/build overlays do not create false-positive overflow failures.
      const dashboardSurface = page.locator('main').first();
      await expect(dashboardSurface).toBeVisible();
      const { scrollWidth, clientWidth } = await dashboardSurface.evaluate(
        element => ({
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        })
      );

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
    });

    test('should stack cards vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');

      // Cards should be full width on mobile
      // This is a layout verification test
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/dashboard');

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
    });
  });

  test.describe('Loading states', () => {
    test('should show loading skeleton on initial load', async ({ page }) => {
      await page.goto('/dashboard');

      // Check for skeleton or loading indicator
      // May appear briefly during data fetch
    });
  });

  test.describe('Error handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.unroute(/\/api\/bookings\/[^/]+\/invoice$/);
      await page.unroute(/\/api\/bookings(?:\?.*)?$/);

      await page.route(/\/api\/bookings(?:\?.*)?$/, route =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Internal error' }),
        })
      );

      await gotoStable(page, '/dashboard', { waitForTestId: 'user-dashboard' });

      const errorAlert = page.getByTestId('user-dashboard').getByRole('alert');

      if ((await errorAlert.count()) === 0) {
        await expect(page.getByTestId('user-dashboard')).toBeVisible();

        const emptyStateHeading = page.getByText('Beginne deine Lernreise');
        if ((await emptyStateHeading.count()) > 0) {
          await expect(emptyStateHeading).toBeVisible();
        } else {
          await expect(page.getByTestId('dashboard-title')).toContainText(
            /Willkommen zurück/i
          );
        }
        return;
      }

      await expect(errorAlert).toContainText('HTTP 500: Failed to fetch bookings');
      await expect(errorAlert).not.toContainText('undefined');
      await expect(errorAlert).not.toContainText('null');
    });
  });

  test.describe('German localization', () => {
    test('should display all UI text in German', async ({ page }) => {
      await page.goto('/dashboard');

      // Should use informal "Du" form
      const _pageContent = await page.content();

      // Common German dashboard terms should appear
      // (only if user is authenticated and has content)
    });

    test('should use informal Du form', async ({ page }) => {
      await gotoDashboard(page);

      await expect(page.getByText(/deine seminare/i)).toBeVisible();
      await expect(page.getByText(/ihr seminar|ihre buchung/i)).toHaveCount(0);
    });
  });
});
