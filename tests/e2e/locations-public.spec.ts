import { expect, test } from '@playwright/test';

const skipInCI = !!process.env.CI || process.env.E2E_TEST === '1';

const TEST_LOCATION = {
  name: '[E2E-TEST] Yoga Studio Wien',
  address: 'Mariahilfer Straße 100',
  city: 'Wien',
  zipCode: '1070',
  email: 'test@yoga-studio.at',
  phone: '+43 1 1234567',
  website: 'https://yoga-studio.at',
};

const TEST_LOCATION_SLUG = 'e2e-test-yoga-studio-wien';

test.describe('Public Location Landing Page', () => {
  test.skip(() => skipInCI, 'Requires API authentication - skipped in CI');

  test.beforeEach(async ({ request }) => {
    await request.post('/api/locations', {
      data: TEST_LOCATION,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterEach(async ({ request }) => {
    await cleanupTestLocations(request);
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

  test.beforeEach(async ({ request }) => {
    await request.post('/api/locations', {
      data: TEST_LOCATION,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterEach(async ({ request }) => {
    await cleanupTestLocations(request);
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

async function cleanupTestLocations(request: {
  get: (url: string) => Promise<{
    ok: () => boolean;
    json: () => Promise<{ locations?: Array<{ id: string; name: string }> }>;
  }>;
  delete: (url: string) => Promise<unknown>;
}) {
  try {
    const response = await request.get('/api/locations');
    if (response.ok()) {
      const data = await response.json();
      const testLocations = data.locations?.filter(location =>
        location.name.includes('[E2E-TEST]')
      );

      for (const location of testLocations || []) {
        await request.delete(`/api/locations/${location.id}`);
      }
    }
  } catch {
    // Ignore cleanup errors in tests.
  }
}