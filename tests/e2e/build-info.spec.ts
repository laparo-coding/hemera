import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

/**
 * BuildInfo badge smoke test
 *
 * Validates that the BuildInfo badge renders in non-E2E production/testing contexts.
 * In CI production E2E (PLAYWRIGHT_BASE_URL is set), the app runs with real providers,
 * so the badge should be visible.
 */

test.skip(
  !!process.env.PLAYWRIGHT_BASE_URL,
  'Skip on external BASE_URL (badge may be suppressed by production settings).'
);

test('build info badge is present on home', async ({ page }) => {
  // In E2E/dev mode, die App zeigt das BuildInfo-Badge immer an.
  await gotoStable(page, '/', { waitForTestId: 'build-info' });
  // The badge may render asynchronously after hydration
  const badge = page.getByTestId('build-info');
  await expect(badge).toBeVisible({ timeout: 10000 });

  // Optionally check title attribute contains sensible info
  const title = await badge.getAttribute('title');
  // Title kann je nach verfügbarer Build-Umgebung entweder "Build: ..." oder nur
  // "Commit: ..." enthalten. Akzeptiere beides, um Stabilität in CI zu gewährleisten.
  expect(title || '').toMatch(/Build|Commit/);
});
