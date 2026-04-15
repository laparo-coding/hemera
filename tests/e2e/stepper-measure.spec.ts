import { expect, test } from '@playwright/test';

const ALIGNMENT_TOLERANCE_PX = 2;

function getTops<T extends { [key: string]: number | null }>(
  steps: T[],
  key: keyof T
): number[] {
  return steps
    .map(step => step[key])
    .filter((value): value is number => typeof value === 'number' && value >= 0);
}

test('measure stepper label alignment', async ({ page }) => {
  await page.goto('/e2e/stepper-debug');
  await page.waitForSelector('[aria-label="Dein Fortschritt"]', { timeout: 15000 });

  const data = await page.evaluate(() => {
    interface StepDetail {
      step: number;
      text: string;
      stepTop: number | null;
      linkTop: number | null;
      linkH: number | null;
      linkDisplay: string | null;
      slTop: number | null;
      icTop: number | null;
      icH: number | null;
      ibTop: number | null;
      ibH: number | null;
      lbTop: number | null;
      lcTop: number | null;
    }

    const steppers = document.querySelectorAll('[aria-label="Dein Fortschritt"]');
    const all: Array<{ stepper: number; steps: StepDetail[] }> = [];

    steppers.forEach((stepper, si) => {
      const steps = stepper.querySelectorAll('.MuiStep-root');
      const stepArr: StepDetail[] = [];

      steps.forEach((step, i) => {
        const ic = step.querySelector('.MuiStepLabel-iconContainer');
        const ib = ic?.firstElementChild as HTMLElement | null;
        const lb = step.querySelector('.MuiStepLabel-label');
        const lc = step.querySelector('.MuiStepLabel-labelContainer');
        const lk = step.querySelector('a');
        const sr = step.querySelector('.MuiStepLabel-root');

        const r = (el: Element | null | undefined) =>
          el ? Math.round(el.getBoundingClientRect().top * 10) / 10 : null;
        const h = (el: Element | null | undefined) =>
          el ? Math.round(el.getBoundingClientRect().height * 10) / 10 : null;

        stepArr.push({
          step: i,
          text: lb?.textContent?.trim().substring(0, 30) ?? 'N/A',
          stepTop: r(step),
          linkTop: r(lk),
          linkH: h(lk),
          linkDisplay: lk ? window.getComputedStyle(lk).display : null,
          slTop: r(sr),
          icTop: r(ic),
          icH: h(ic),
          ibTop: r(ib),
          ibH: h(ib),
          lbTop: r(lb),
          lcTop: r(lc),
        });
      });

      all.push({ stepper: si, steps: stepArr });
    });
    return all;
  });

  for (const s of data) {
    console.log(`\n=== Stepper ${s.stepper} ===`);
    for (const st of s.steps) {
      console.log(JSON.stringify(st));
    }
    const iconTops = getTops(s.steps, 'ibTop');
    const labelTops = getTops(s.steps, 'lbTop');
    const iconDelta =
      iconTops.length > 1 ? Math.max(...iconTops) - Math.min(...iconTops) : 0;
    const labelDelta =
      labelTops.length > 1
        ? Math.max(...labelTops) - Math.min(...labelTops)
        : 0;
    console.log('Icon tops:', iconTops);
    console.log('Icon delta:', iconDelta);
    console.log('Label tops:', labelTops);
    console.log('Label delta:', labelDelta);
  }

  // Assertion: all icon and label tops within tolerance
  expect(data.length, 'Expected at least one stepper').toBeGreaterThan(0);
  for (const s of data) {
    const iconTops = getTops(s.steps, 'ibTop');
    const labelTops = getTops(s.steps, 'lbTop');
    if (iconTops.length > 1) {
      const iconDelta = Math.max(...iconTops) - Math.min(...iconTops);
      expect(iconDelta, `Stepper ${s.stepper}: icon tops should be aligned`).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);
    }
    if (labelTops.length > 1) {
      const labelDelta = Math.max(...labelTops) - Math.min(...labelTops);
      expect(labelDelta, `Stepper ${s.stepper}: label tops should be aligned`).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);
    }
  }
});
