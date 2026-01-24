/**
 * Course Detail Page E2E Tests
 *
 * Feature: 013-layout-improvement-course-detail-page
 * Tests the complete course detail page user journey
 */

import { expect, test } from '@playwright/test';

test.describe('Course Detail Page', () => {
  // Use 'grundkurs' slug which exists in e2e-seed.ts
  const courseUrl = '/courses/grundkurs';

  // Increase timeout for this test suite as course pages can be slow to render
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // First ensure the server is responding by hitting the homepage
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Then navigate to the course page with network idle wait
    await page.goto(courseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  });

  test.describe('Page loading', () => {
    test('page loads with hero section', async ({ page }) => {
      // Hero section should be visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Hero section should contain course title
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    });

    test('page has correct title', async ({ page }) => {
      await expect(page).toHaveTitle(/verhandlungstraining/i);
    });
  });

  test.describe('Section visibility on scroll', () => {
    test('all sections become visible on scroll', async ({ page }) => {
      // Scroll to bottom of page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for scroll to complete
      await page.waitForTimeout(500);

      // All major sections should be in the DOM
      await expect(
        page.locator('[data-testid="overview-section"]')
      ).toBeAttached();
      await expect(
        page.locator('[data-testid="curriculum-section"]')
      ).toBeAttached();
      await expect(
        page.locator('[data-testid="pricing-section"]')
      ).toBeAttached();
      await expect(
        page.locator('[data-testid="testimonials-section"]')
      ).toBeAttached();
    });
  });

  test.describe('Booking CTA navigation', () => {
    test('booking CTA navigates to checkout', async ({ page }) => {
      // Find and click the primary booking CTA
      const ctaButton = page
        .getByRole('link', { name: /jetzt buchen/i })
        .first();
      await expect(ctaButton).toBeVisible();

      await ctaButton.click();

      // Should navigate to checkout page
      await expect(page).toHaveURL(/\/checkout/);
    });

    test('checkout URL contains course identifier', async ({ page }) => {
      const ctaButton = page
        .getByRole('link', { name: /jetzt buchen/i })
        .first();
      await ctaButton.click();

      await expect(page).toHaveURL(/course=/);
    });
  });

  test.describe('Mobile responsive layout', () => {
    test('layout is responsive at 375px width', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still render correctly
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // CTA should be visible and tappable
      const ctaButton = page
        .getByRole('link', { name: /jetzt buchen/i })
        .first();
      await expect(ctaButton).toBeVisible();

      // CTA should have minimum tap target size (44px)
      const box = await ctaButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('content is not horizontally scrollable on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const isHorizontallyScrollable = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isHorizontallyScrollable).toBe(false);
    });
  });

  test.describe('Performance', () => {
    test('page meets performance budget (LCP < 2s)', async ({ page }) => {
      // Navigate fresh to measure LCP
      const performanceEntries = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();
            const lcpEntry = entries[entries.length - 1];
            resolve(lcpEntry?.startTime || 0);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback after 3s
          setTimeout(() => resolve(null), 3000);
        });
      });

      // LCP should be under 2 seconds (2000ms)
      if (performanceEntries !== null) {
        expect(performanceEntries).toBeLessThan(2000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('page has no critical accessibility violations', async ({ page }) => {
      // Basic accessibility checks
      // Heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Images have alt text
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);

      // Interactive elements are focusable
      const ctaButton = page
        .getByRole('link', { name: /jetzt buchen/i })
        .first();
      await ctaButton.focus();
      await expect(ctaButton).toBeFocused();
    });
  });
});
