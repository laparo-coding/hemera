import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

/**
 * BuildInfo badge removal smoke test
 *
 * Validates that the global BuildInfo badge no longer renders on public pages.
 */

test.skip(
  !process.env.PLAYWRIGHT_BASE_URL,
  'Skip unless external BASE_URL is configured.'
);

test('build info badge is not present on home', async ({ page }) => {
  await gotoStable(page, '/');
  await expect(page.getByTestId('build-info')).not.toBeAttached();
});
