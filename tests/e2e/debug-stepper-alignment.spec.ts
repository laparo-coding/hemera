/**
 * Debug script: measure vertical alignment of stepper step labels.
 * Run with: npx playwright test tests/e2e/debug-stepper-alignment.spec.ts --headed
 */
import { expect, test } from '@playwright/test';

const ALIGNMENT_TOLERANCE_PX = 2;
const STEPPER_WAIT_TIMEOUT_MS = 15000;

interface StepMeasurement {
  index: number;
  labelText: string;
  iconTop: number;
  iconBottom: number;
  iconHeight: number;
  labelTop: number;
  labelBottom: number;
  labelContainerTop: number;
}

test('measure stepper label alignment on stepper-debug page', async ({ page }) => {
  await page.goto('/e2e/stepper-debug');
  await page.waitForSelector('[aria-label="Dein Fortschritt"]', {
    timeout: STEPPER_WAIT_TIMEOUT_MS,
  });

  // Get bounding boxes for all step labels and icons
  const data = await page.evaluate<
    { error: string } | { results: StepMeasurement[] }
  >(() => {
    const stepper = document.querySelector(
      '[aria-label="Dein Fortschritt"]',
    );
    if (!stepper) return { error: 'Stepper not found' };

    const steps = stepper.querySelectorAll('.MuiStep-root');
    const results: StepMeasurement[] = [];

    steps.forEach((step, index) => {
      // Icon container (the Box around the number/check)
      const iconWrapper = step.querySelector('.MuiStepLabel-iconContainer');
      
      // Label
      const label = step.querySelector('.MuiStepLabel-label');
      const labelContainer = step.querySelector('.MuiStepLabel-labelContainer');

      const iconRect = iconWrapper?.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      const labelContainerRect = labelContainer?.getBoundingClientRect();

      results.push({
        index,
        labelText: label?.textContent?.trim().substring(0, 30) || 'N/A',
        iconTop: iconRect?.top ?? -1,
        iconBottom: iconRect?.bottom ?? -1,
        iconHeight: iconRect?.height ?? -1,
        labelTop: labelRect?.top ?? -1,
        labelBottom: labelRect?.bottom ?? -1,
        labelContainerTop: labelContainerRect?.top ?? -1,
      });
    });

    return { results };
  });

  console.log('\n=== STEPPER ALIGNMENT DEBUG ===');
  console.log(JSON.stringify(data, null, 2));

  if ('error' in data) {
    throw new Error(`Stepper evaluation failed: ${data.error}`);
  }

  if ('results' in data && Array.isArray(data.results)) {
    expect(data.results.length).toBeGreaterThanOrEqual(2);

    // Check that all icon tops are the same
    const iconTops = data.results.map(r => r.iconTop).filter(v => v >= 0);
    const labelTops = data.results.map(r => r.labelTop).filter(v => v >= 0);
    
    console.log('\nIcon tops:', iconTops);
    console.log('Label tops:', labelTops);

    expect(iconTops.length, 'Need at least 2 icon measurements').toBeGreaterThanOrEqual(2);
    expect(labelTops.length, 'Need at least 2 label measurements').toBeGreaterThanOrEqual(2);

    const maxIconDelta = Math.max(...iconTops) - Math.min(...iconTops);
    console.log(`\nMax icon Y delta: ${maxIconDelta}px`);
    expect(maxIconDelta, 'Icon tops should be aligned').toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);

    const maxLabelDelta = Math.max(...labelTops) - Math.min(...labelTops);
    console.log(`Max label Y delta: ${maxLabelDelta}px`);
    expect(maxLabelDelta, 'Label tops should be aligned').toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);
    return;
  }

  throw new Error(
    `Unexpected stepper evaluation payload: ${JSON.stringify(data, null, 2)}`
  );
});
