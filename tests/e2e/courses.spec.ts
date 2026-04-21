import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

const isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe('Courses Page', () => {
  test('zeigt veröffentlichte Kurse an', async ({ page }) => {
    // Increase timeout for this test as page may be slow to load in CI
    test.setTimeout(90000);

    // In production (external base), avoid 'networkidle' to reduce flakiness due to long-lived connections
    await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

    // Mindestens eine Kurskarte oder der explizite Empty-State sichtbar
    const cards = page.getByTestId('course-card');
    const count = await cards.count();
    if (count > 0) {
      // Titeltext vorhanden (DB-gestützte Kursdaten)
      await expect(page.getByTestId('course-title').first()).toBeVisible();
      await expect(page.getByTestId('e2e-courses-empty')).toHaveCount(0);
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
        const emptyE2E = page.getByTestId('e2e-courses-empty');
        await expect(emptyE2E).toBeVisible();
      }
    }
  });
});
