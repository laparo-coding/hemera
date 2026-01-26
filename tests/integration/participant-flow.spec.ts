import { expect, test } from '@playwright/test';

const _participantEmail = 'participant@example.com';

test.describe('Course Participation Flow', () => {
  test('walks participant through preparation → summary → debriefing → results', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await page.goto('http://localhost:3000/my-courses');
    await expect(
      page.getByTestId('course-participation-stepper')
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /preparation/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /summary/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /debriefing/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /results/i })).toBeVisible();

    throw new Error(
      'TDD: Implement participant flow UI so this scenario passes (form submissions, résumé upload, summary playback).'
    );
  });
});
