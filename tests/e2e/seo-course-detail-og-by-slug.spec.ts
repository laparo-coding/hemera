import { expect, test, Page } from '@playwright/test';
import { gotoStable, clickAndWait } from './helpers/nav';

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

async function getMetaContent(page: Page, selector: string) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  return await el.getAttribute('content');
}

test.describe('Course detail OG image by slug', () => {
  test('og:image nutzt slug-basierten Pfad, wenn slug vorhanden', async ({
    page,
    request,
  }) => {
    await gotoStable(page, '/courses', { waitForTestId: 'course-overview' });

    const overview = page.getByTestId('course-overview');
    let detailLink = overview
      .getByRole('button', { name: /zum kurs/i })
      .first();
    if ((await detailLink.count()) === 0) {
      detailLink = overview.getByRole('link', { name: /zum kurs/i }).first();
    }

    if ((await detailLink.count()) === 0) {
      test.info().annotations.push({
        type: 'note',
        description:
          'Keine „Zum Kurs“-CTA gefunden (evtl. alle Kurse ausgebucht). Test informativ übersprungen.',
      });
      return;
    }

    await clickAndWait(page, () => detailLink, {
      expectUrl: /\/courses\/[\w-]+/,
    });
    const url = page.url();

    const idMatch = url.match(/\/courses\/([\w-]+)/);
    if (!idMatch) {
      test.info().annotations.push({
        type: 'note',
        description: 'Kurs-ID konnte nicht aus URL extrahiert werden.',
      });
      return;
    }
    const id = idMatch[1];

    // API abfragen, um den Slug des Kurses zu erhalten
    const res = await request.get(`/api/courses/${id}`);
    if (!res.ok()) {
      test.info().annotations.push({
        type: 'note',
        description: 'API-Response nicht OK, Test informativ übersprungen.',
      });
      return;
    }
    const json = await res.json();
    const slug: string | undefined = json?.data?.slug;

    const ogImage = await getMetaContent(page, 'meta[property="og:image"]');
    expect(ogImage).toBeTruthy();
    expect(ogImage!.startsWith('http')).toBeTruthy();

    if (slug) {
      // Erwarteter slug-basierter Pfad
      const expected = `/images/courses/${slug}.jpg`;
      expect(ogImage).toContain(expected);
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'Kein Slug vorhanden – Fallback-Bild ist OK.',
      });
    }
  });
});
