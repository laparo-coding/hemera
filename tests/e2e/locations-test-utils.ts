import type { Page } from '@playwright/test';
import { locationListResponseSchema } from '../../lib/schemas/location-schema';

export const TEST_LOCATION = {
  name: '[E2E-TEST] Yoga Studio Wien',
  address: 'Mariahilfer Straße 100',
  city: 'Wien',
  zipCode: '1070',
  email: 'test@yoga-studio.at',
  phone: '+43 1 1234567',
  website: 'https://yoga-studio.at',
};

export const TEST_LOCATION_SLUG = 'e2e-test-yoga-studio-wien';

export async function createTestLocation(page: Page): Promise<void> {
  const response = await page.request.post('/api/locations', {
    data: TEST_LOCATION,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create test location: ${response.status()} ${await response.text()}`
    );
  }
}

export async function cleanupTestLocations(page: Page): Promise<void> {
  try {
    const response = await page.request.get('/api/locations');
    if (response.ok()) {
      const parsed = locationListResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        return;
      }

      const testLocations = parsed.data.locations.filter(location =>
        location.name.includes('[E2E-TEST]')
      );

      for (const location of testLocations || []) {
        await page.request.delete(`/api/locations/${location.id}`);
      }
    }
  } catch {
    // Ignore cleanup errors in tests.
  }
}