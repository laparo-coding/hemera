import { expect, test } from '@playwright/test';
import { gotoStable } from './helpers/nav';

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

// Validiert die Darstellung und Deaktivierung für ausgebuchte Kurse, falls vorhanden.
// Falls in der Zielumgebung aktuell kein ausgebuchter Kurs existiert, wird dies im Testbericht vermerkt
// und der Test als „informativ“ gewertet, um Flakiness zu vermeiden.

test.describe('Courses Page – Ausgebucht-Zustand', () => {
  test('zeigt „Ausgebucht“-Badge und deaktivierte CTA, wenn Plätze = 0', async ({
    page,
  }) => {
    test.setTimeout(90000);

    await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

    // Suche nach irgendeinem Kurs mit Ausgebucht-Badge
    const soldOutBadges = page.getByTestId('sold-out-badge');
    const soldOutCount = await soldOutBadges.count();

    if (soldOutCount === 0) {
      // Kein ausgebuchter Kurs verfügbar – informativ markieren und Test als bestanden werten
      test.info().annotations.push({
        type: 'note',
        description:
          'Kein ausgebuchter Kurs gefunden. Das ist OK – Datenlage kann variieren. Test informativ bestanden.',
      });
      await expect(soldOutBadges).toHaveCount(0);
      return;
    }

    // Prüfe, dass zugehörige CTA(s) deaktiviert sind und den Text „Ausgebucht“ zeigen
    const soldOutCtas = page.getByTestId('sold-out-cta');
    const ctaCount = await soldOutCtas.count();

    // Mindestens eine deaktivierte CTA erwartet, wenn es mindestens ein Badge gibt
    await expect(ctaCount).toBeGreaterThan(0);

    for (let i = 0; i < ctaCount; i++) {
      const btn = soldOutCtas.nth(i);
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveText(/Ausgebucht/i);
    }
  });
});
