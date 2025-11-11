import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

test.describe('Courses empty state', () => {
  test.beforeAll(async ({ request }) => {
    // Warm cache/buffer regardless of deployment base URL
    for (const path of ['/', '/courses']) {
      try {
        await request.get(path, { timeout: 3000 });
      } catch {
        // best-effort only for environments where the route is available
      }
    }
  });

  test('zeigt leeren Zustand, wenn keine Kurse vorhanden', async ({ page }) => {
    await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

    const cards = page.getByTestId('course-card');
    const count = await cards.count();

    if (count > 0) {
      test.info().annotations.push({
        type: 'note',
        description: 'Kurse vorhanden – Empty-State informativ übersprungen.',
      });
      return;
    }

    await expect(page.getByTestId('e2e-courses-empty')).toBeVisible();
    await expect(page.getByText(/Bald verfügbar!/i)).toBeVisible();
  });
});
