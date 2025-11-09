import { expect, test, Page } from '@playwright/test';
import { gotoStable, clickAndWait } from './helpers/nav';

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

async function getMetaContent(page: Page, selector: string) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  return await el.getAttribute('content');
}

test.describe('Course detail OG/Twitter metadata', () => {
  test('og:image absolute, og:title enthält Titel, twitter:card vorhanden', async ({
    page,
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

    // H1 Titel extrahieren
    const heading = page.getByRole('heading', { level: 1 }).first();
    const titleText = (await heading.textContent())?.trim();

    // OG Bild prüfen (muss absolut sein)
    const ogImage = await getMetaContent(page, 'meta[property="og:image"]');
    expect(ogImage).toBeTruthy();
    expect(ogImage!.startsWith('http')).toBeTruthy();

    // OG Title enthält den sichtbaren Titel
    const ogTitle = await getMetaContent(page, 'meta[property="og:title"]');
    expect(ogTitle).toBeTruthy();
    if (titleText) {
      expect(ogTitle!.toLowerCase()).toContain(titleText.toLowerCase());
    }

    // Twitter Card vorhanden
    const twitterCard = await getMetaContent(page, 'meta[name="twitter:card"]');
    expect(twitterCard).toBeTruthy();
    expect(['summary_large_image', 'summary']).toContain(twitterCard);
  });
});
