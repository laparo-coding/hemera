import { expect, test, type Page } from '@playwright/test';
import { AuthHelper } from './auth-helper';
import {
  TEST_LOCATION,
  TEST_LOCATION_SLUG,
  cleanupTestLocations,
  createTestLocation,
} from './locations-test-utils';

const skipInCI = !!process.env.CI || process.env.E2E_TEST === '1';

test.describe('Public Location Landing Page', () => {
  test.skip(() => skipInCI, 'Requires API authentication - skipped in CI');

  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.prepareCleanAuthState();
    await authHelper.signIn(
      'e2e.admin@example.com',
      'E2ETestPassword2024!SecureForTesting'
    );
    await createTestLocation(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestLocations(page);
  });

  test('should display location details on landing page', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      TEST_LOCATION.name.replace('[E2E-TEST] ', '')
    );
    await expect(page.getByText(TEST_LOCATION.address)).toBeVisible();
    await expect(page.getByText(TEST_LOCATION.city)).toBeVisible();
    await expect(page.getByText(TEST_LOCATION.email)).toBeVisible();
    await expect(page.getByText(TEST_LOCATION.phone)).toBeVisible();
  });

  test('should have clickable contact links', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const emailLink = page.locator(`a[href="mailto:${TEST_LOCATION.email}"]`);
    await expect(emailLink).toBeVisible();

    const phoneLink = page.locator('a[href^="tel:"]');
    await expect(phoneLink).toBeVisible();

    const websiteLink = page.locator(`a[href="${TEST_LOCATION.website}"]`);
    await expect(websiteLink).toBeVisible();
    await expect(websiteLink).toHaveAttribute('target', '_blank');
  });

  test('should return 404 for non-existent location', async ({ page }) => {
    await page.goto('/locations/non-existent-location-slug');
    await expect(page.getByText(/404|nicht gefunden/i)).toBeVisible();
  });

  test('should have Google Maps navigation button', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const googleMapsButton = page.getByRole('link', { name: /Google Maps/i });
    await expect(googleMapsButton).toBeVisible();
    await expect(googleMapsButton).toHaveAttribute('target', '_blank');

    const href = await googleMapsButton.getAttribute('href');
    expect(href).toContain('google.com/maps');
  });

  test('should have Apple Maps navigation button', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const appleMapsButton = page.getByRole('link', { name: /Apple Maps/i });
    await expect(appleMapsButton).toBeVisible();
    await expect(appleMapsButton).toHaveAttribute('target', '_blank');

    const href = await appleMapsButton.getAttribute('href');
    expect(href).toContain('maps.apple.com');
  });

  test('should have correct meta tags on landing page', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const title = await page.title();
    expect(title).toContain('Yoga Studio Wien');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /Yoga Studio Wien/i);

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'place');
  });
});

test.describe('Location Mobile Responsiveness', () => {
  test.skip(() => skipInCI, 'Requires API authentication - skipped in CI');

  test.use({ viewport: { width: 375, height: 667 } });

  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.prepareCleanAuthState();
    await authHelper.signIn(
      'e2e.admin@example.com',
      'E2ETestPassword2024!SecureForTesting'
    );
    await createTestLocation(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestLocations(page);
  });

  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(TEST_LOCATION.address)).toBeVisible();
    await expect(page.getByText(TEST_LOCATION.email)).toBeVisible();
  });

  test('should have touch-friendly navigation buttons', async ({ page }) => {
    await page.goto(`/locations/${TEST_LOCATION_SLUG}`);

    const googleButton = page.getByRole('link', { name: /Google Maps/i });
    const box = await googleButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(36);
    expect(box?.width).toBeGreaterThanOrEqual(100);
  });
});
