import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

test.describe('Legacy /protected redirect', () => {
  test.skip(
    !!process.env.PLAYWRIGHT_BASE_URL,
    'Skip on external BASE_URL where platform caching/edge may bypass app middleware.'
  );
  test('GET /protected/foo should redirect to /dashboard (final URL)', async ({
    page,
  }) => {
    await gotoStable(page, '/protected/foo');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
