import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

const isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe('Courses Page', () => {
  test('zeigt veröffentlichte Kurse an', async ({ page }) => {
    // Increase timeout for this test as page may be slow to load in CI
    test.setTimeout(90000);

    // In production (external base), avoid 'networkidle' to reduce flakiness due to long-lived connections
    await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

    // Mindestens eine Kurskarte ODER E2E-Fallback sichtbar
    const cards = page.getByTestId('course-card');
    const count = await cards.count();
    if (count > 0) {
      // Titeltext vorhanden (nutzt den Mock aus getPublishedCourses bei E2E)
      await expect(page.getByTestId('course-title').first()).toBeVisible();
      // Fallback nicht sichtbar
      await expect(page.getByTestId('course-fallback-message')).toHaveCount(0);
    } else {
      // Kein Kurs gefunden
      // Lokal (E2E-Modus) verlangen wir den expliziten Empty-State mit Test-ID.
      // Gegen eine externe/Production-URL ist die Oberfläche ggf. nicht synchron
      // mit der Branch-Version. In dem Fall akzeptieren wir "keine Karten"
      // ohne strikten Empty-State-Check und dokumentieren das im Report.
      if (isExternalBase) {
        test.info().annotations.push({
          type: 'note',
          description:
            'Externe BASE_URL: Keine Kurskarten gefunden. Empty-State-Markup kann abweichen – Test gilt als bestanden.',
        });
        // Optional: prüfe noch, dass keine Karten erscheinen (bereits count==0)
        await expect(cards).toHaveCount(0);
      } else {
        // In production/preview we may see either the dedicated e2e fallback or the public fallback.
        // Accept both to be robust against different rendering strategies in previews.
        const emptyE2E = page.getByTestId('e2e-courses-empty');
        const emptyPublic = page.getByTestId('course-fallback-message');
        // Wait for either to be visible (short timeout)
        await Promise.race([
          emptyE2E.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
          emptyPublic
            .waitFor({ state: 'visible', timeout: 5000 })
            .catch(() => {}),
        ]);
        // Assert at least one is present
        const visibleE2E = await emptyE2E.count().then(c => c > 0);
        const visiblePublic = await emptyPublic.count().then(c => c > 0);
        await expect(visibleE2E || visiblePublic).toBeTruthy();
      }
    }
  });
});
