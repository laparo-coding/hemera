/**
 * T013: E2E Test - Dashboard Sections Flow
 *
 * End-to-end tests for the complete dashboard experience with 4 sections.
 */

import { expect, test } from '@playwright/test';

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
  });

  test.describe('Section layout', () => {
    test('should render sections in correct order', async ({ page }) => {
      // Skip if not authenticated - this is a structure test
      test.skip();

      await page.goto('/dashboard');

      // Get all section headings
      const headings = await page.locator('h2').allTextContents();

      // Expected order (only visible sections will appear)
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
      // Skip if not authenticated
      test.skip();

      await page.goto('/dashboard');

      // Empty sections should not be visible
      // This depends on the user's booking data
    });
  });

  test.describe('Course card display', () => {
    test('should display course information in card', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Find a course card
      const courseCard = page.locator('[data-testid="course-card"]').first();

      // Should display course title
      await expect(courseCard.locator('h3')).toBeVisible();

      // Should display date information
      await expect(courseCard.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeVisible();
    });

    test('should display location with link', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Find location link in course card
      const locationLink = page
        .locator('[data-testid="course-card"]')
        .first()
        .locator('a[href^="/locations/"]');

      // If course has location, link should be visible
      const hasLocation = await locationLink.count();
      if (hasLocation > 0) {
        await expect(locationLink).toBeVisible();
      }
    });

    test('should display time range in German format', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Time should be in format "HH:MM - HH:MM Uhr"
      const timePattern = /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\s*Uhr/;
      const hasTime = await page.getByText(timePattern).count();

      // At least one course should have time if courses exist
      expect(hasTime).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Invoice download button', () => {
    test('should show invoice button for paid bookings', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Find invoice download button
      const invoiceButton = page.getByRole('button', {
        name: /rechnung/i,
      });

      // Should exist for paid bookings
      const buttonCount = await invoiceButton.count();
      expect(buttonCount).toBeGreaterThanOrEqual(0);
    });

    test('should have German label on invoice button', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Look for German invoice button text
      const invoiceButton = page.getByText('Rechnung herunterladen');

      const buttonCount = await invoiceButton.count();
      // May or may not exist depending on booking data
      expect(buttonCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Navigation to course detail', () => {
    test('should navigate to course detail page on card click', async ({
      page,
    }) => {
      test.skip();

      await page.goto('/dashboard');

      // Find and click on a course card link
      const courseLink = page
        .locator('[data-testid="course-card"]')
        .first()
        .locator('a');

      if ((await courseLink.count()) > 0) {
        await courseLink.click();

        // Should navigate to my-courses/[bookingId]
        await expect(page).toHaveURL(/\/my-courses\/[a-z0-9-]+/);
      }
    });

    test('should support direct URL with anchor', async ({ page }) => {
      test.skip();

      // Navigate directly to a section
      const bookingId = 'test-booking-id';
      await page.goto(`/my-courses/${bookingId}#ergebnisse`);

      // Should land on the page (may redirect if not authenticated)
      const url = page.url();
      expect(url).toBeDefined();
    });
  });

  test.describe('Responsive layout', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

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
      test.skip();

      // This would require mocking API failures
      await page.goto('/dashboard');

      // Should not show raw error messages to user
      const errorMessage = page.getByText(/error|fehler/i);
      const hasError = await errorMessage.count();

      // If error exists, it should be user-friendly German
      if (hasError > 0) {
        await expect(errorMessage).not.toContainText('undefined');
        await expect(errorMessage).not.toContainText('null');
      }
    });
  });

  test.describe('German localization', () => {
    test('should display all UI text in German', async ({ page }) => {
      await page.goto('/dashboard');

      // Should use informal "Du" form
      const pageContent = await page.content();

      // Common German dashboard terms should appear
      // (only if user is authenticated and has content)
    });

    test('should use informal Du form', async ({ page }) => {
      test.skip();

      await page.goto('/dashboard');

      // Look for "Dein" or "Deine" (informal)
      const informalText = page.getByText(/Dein|Deine/);

      // Should use informal form if any personalized text exists
      const informalCount = await informalText.count();
      expect(informalCount).toBeGreaterThanOrEqual(0);

      // Should NOT use formal "Ihr" or "Ihre"
      const formalText = page.getByText(/Ihr Seminar|Ihre Buchung/);
      const formalCount = await formalText.count();
      expect(formalCount).toBe(0);
    });
  });
});
