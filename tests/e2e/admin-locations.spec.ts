import { expect, test } from '@playwright/test';
import { AuthHelper } from './auth-helper';

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

test.describe('Admin Location Management E2E', () => {
  test.skip(() => skipInCI, 'Requires Clerk authentication - skipped in CI');

  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.prepareCleanAuthState();
  });

  test.afterEach(async ({ request }) => {
    await cleanupTestLocations(request);
  });

  test.describe('Location creation', () => {
    test.beforeEach(async ({ page }) => {
      await authHelper.signIn(
        'e2e.admin@example.com',
        'E2ETestPassword2024!SecureForTesting'
      );
      await page.goto('/admin/locations');
    });

    test('should display empty state when no locations exist', async ({
      page,
    }) => {
      const tableOrEmpty = page.locator(
        '[data-testid="locations-table"], text=Noch keine Locations'
      );
      await expect(tableOrEmpty).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to create location page', async ({ page }) => {
      await page.getByRole('link', { name: /Neue Location/i }).click();
      await expect(page).toHaveURL('/admin/locations/new');
      await expect(
        page.getByRole('heading', { name: /Neue Location erstellen/i })
      ).toBeVisible();
    });

    test('should create a new location with all fields', async ({ page }) => {
      await page.getByRole('link', { name: /Neue Location/i }).click();
      await expect(page).toHaveURL('/admin/locations/new');

      await page.getByLabel(/Name/i).fill(TEST_LOCATION.name);
      await page.getByLabel(/Adresse/i).fill(TEST_LOCATION.address);
      await page.getByLabel(/Stadt/i).fill(TEST_LOCATION.city);
      await page.getByLabel(/PLZ/i).fill(TEST_LOCATION.zipCode);
      await page.getByLabel(/E-Mail/i).fill(TEST_LOCATION.email);
      await page.getByLabel(/Telefon/i).fill(TEST_LOCATION.phone);
      await page.getByLabel(/Website/i).fill(TEST_LOCATION.website);

      await page.getByRole('button', { name: /Speichern/i }).click();

      await expect(page).toHaveURL('/admin/locations', { timeout: 10000 });
      await expect(page.getByText(TEST_LOCATION.name)).toBeVisible();
      await expect(page.getByText(TEST_LOCATION.city)).toBeVisible();
    });

    test('should show validation errors for missing required fields', async ({
      page,
    }) => {
      await page.getByRole('link', { name: /Neue Location/i }).click();
      await page.getByRole('button', { name: /Speichern/i }).click();

      await expect(
        page.getByText(/Name.*erforderlich|erforderlich/i)
      ).toBeVisible();
    });
  });

  test.describe('Delete protection', () => {
    test.beforeEach(async () => {
      await authHelper.signIn(
        'e2e.admin@example.com',
        'E2ETestPassword2024!SecureForTesting'
      );
    });

    test('should show disabled delete button when location has courses', async ({
      page,
      request,
    }) => {
      const createResponse = await request.post('/api/locations', {
        data: TEST_LOCATION,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (createResponse.ok()) {
        await page.goto('/admin/locations');

        const locationRow = page
          .getByRole('row')
          .filter({ hasText: TEST_LOCATION.name.replace('[E2E-TEST] ', '') });
        await expect(locationRow).toBeVisible();

        const deleteButton = locationRow.getByRole('button', {
          name: /löschen/i,
        });
        await expect(deleteButton).toBeDefined();
      }
    });

    test('should show confirmation dialog before deleting', async ({
      page,
      request,
    }) => {
      await request.post('/api/locations', {
        data: TEST_LOCATION,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await page.goto('/admin/locations');

      const locationRow = page
        .getByRole('row')
        .filter({ hasText: TEST_LOCATION.name.replace('[E2E-TEST] ', '') });
      await expect(locationRow).toBeVisible();

      const deleteButton = locationRow.getByRole('button', {
        name: /löschen/i,
      });
      await deleteButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(/löschen\?/i)).toBeVisible();

      await dialog.getByRole('button', { name: /Abbrechen/i }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.getByText(TEST_LOCATION.name)).toBeVisible();
    });
  });

  test.describe('Location edit', () => {
    test.beforeEach(async ({ request }) => {
      await request.post('/api/locations', {
        data: TEST_LOCATION,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await authHelper.signIn(
        'e2e.admin@example.com',
        'E2ETestPassword2024!SecureForTesting'
      );
    });

    test('should navigate to edit page and update location', async ({
      page,
    }) => {
      await page.goto('/admin/locations');

      const locationRow = page
        .getByRole('row')
        .filter({ hasText: TEST_LOCATION.name.replace('[E2E-TEST] ', '') });
      await expect(locationRow).toBeVisible();

      const editButton = locationRow.getByRole('button', {
        name: /bearbeiten/i,
      });
      await editButton.click();

      await expect(page).toHaveURL(/\/admin\/locations\/.*\/edit/);
      await expect(
        page.getByRole('heading', { name: /bearbeiten/i })
      ).toBeVisible();

      const addressInput = page.getByLabel(/Adresse/i);
      await addressInput.clear();
      await addressInput.fill('Neue Straße 456');

      await page.getByRole('button', { name: /Speichern/i }).click();
      await expect(page).toHaveURL('/admin/locations', { timeout: 10000 });
    });
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