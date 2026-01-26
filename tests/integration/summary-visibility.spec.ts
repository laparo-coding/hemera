import { expect, test } from '@playwright/test';

const bookingWithoutSummary = 'booking-no-summary';
const bookingWithSummary = 'booking-with-summary';

test.describe('Course Participation Summary Visibility', () => {
  test('hides Summary step when no Mux assets exist', async ({ page }) => {
    await page.goto(
      `http://localhost:3000/my-courses/${bookingWithoutSummary}`
    );

    await expect(
      page.getByTestId('course-participation-stepper')
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /preparation/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /summary/i })).toBeHidden();

    throw new Error(
      'TDD: Implement conditional Summary step removal when no assets available.'
    );
  });

  test('shows Summary step when course or booking assets exist', async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/my-courses/${bookingWithSummary}`);

    await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible();
    await expect(page.getByTestId('summary-asset-list')).toBeVisible();

    throw new Error(
      'TDD: Implement Summary asset rendering using Mux playback IDs.'
    );
  });
});
