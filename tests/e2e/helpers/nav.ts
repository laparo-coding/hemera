import type { Page, Response } from '@playwright/test';

type GotoStableOptions = {
  waitForTestId?: string;
  waitUntil?: 'domcontentloaded' | 'load' | 'networkidle' | 'commit';
  timeout?: number;
};

/**
 * gotoStable navigiert zu einem Pfad mit einer konservativen Warte-Strategie
 * (default: 'domcontentloaded') und optionalem Sichtbarkeits-Wait auf ein TestId-Element.
 */
export async function gotoStable(
  page: Page,
  path: string,
  opts: GotoStableOptions = {}
): Promise<Response | null> {
  const { waitForTestId, waitUntil = 'domcontentloaded', timeout } = opts;
  const response = await page.goto(path, { waitUntil, timeout });

  if (waitForTestId) {
    await page
      .getByTestId(waitForTestId)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }
  return response;
}

/**
 * clickAndWait navigiert per Klick (Client-Side Routing) und wartet bis die URL passt
 * und optional eine TestId sichtbar ist.
 */
export async function clickAndWait(
  page: Page,
  clickSelector: () => ReturnType<Page['locator']>,
  options: {
    expectUrl?: RegExp | string;
    waitForTestId?: string;
    timeout?: number;
  } = {}
): Promise<void> {
  const { expectUrl, waitForTestId, timeout } = options;

  const locator = clickSelector();
  await locator.first().click();

  if (expectUrl) {
    await page.waitForURL(expectUrl, { timeout: timeout ?? 30_000 });
  }

  if (waitForTestId) {
    await page
      .getByTestId(waitForTestId)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }
}
