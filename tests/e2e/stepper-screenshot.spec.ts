import { expect, test } from '@playwright/test';

const ALIGNMENT_TOLERANCE_PX = 2;
const STEPPER_WAIT_TIMEOUT_MS = 15000;

function getRoundedTop(element: Element | null): number | null {
  if (!element) {
    return null;
  }

  return Math.round(element.getBoundingClientRect().top * 10) / 10;
}

test('screenshot stepper-debug page and verify label alignment', async ({ page }) => {
  await page.goto('/e2e/stepper-debug');
  const progressLocator = page.locator('[aria-label="Dein Fortschritt"]');
  await progressLocator.first().waitFor({ timeout: STEPPER_WAIT_TIMEOUT_MS });
  await page.screenshot({ path: 'test-results/stepper-debug.png', fullPage: true });

  // Also measure alignment
  const data = await page.evaluate(() => {
    const steppers = document.querySelectorAll('[aria-label="Dein Fortschritt"]');
    const all: Array<{ stepper: number; labels: (number | null)[]; delta: number }> = [];
    steppers.forEach((stepper, si) => {
      const steps = stepper.querySelectorAll('.MuiStep-root');
      const tops: (number | null)[] = [];
      steps.forEach((step) => {
        const lb = step.querySelector('.MuiStepLabel-label');
        tops.push(getRoundedTop(lb));
      });
      const validTops = tops.filter((v): v is number => v !== null);
      all.push({ stepper: si, labels: tops, delta: validTops.length > 1 ? Math.max(...validTops) - Math.min(...validTops) : 0 });
    });
    return all;
  });

  expect(data.length, 'Expected at least one stepper on the page').toBeGreaterThan(0);
  for (const s of data) {
    console.log(`Stepper ${s.stepper}: labels=${JSON.stringify(s.labels)}`);
    console.log(`Stepper ${s.stepper}: delta=${s.delta}px`);
    expect(s.delta, `Stepper ${s.stepper}: label alignment exceeds ${ALIGNMENT_TOLERANCE_PX}px tolerance`).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);
  }
});
