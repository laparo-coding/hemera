import { expect, test } from '@playwright/test';

const bookingId = 'test-booking-id';

const stepRoutes = [
  {
    route: 'vorbereitung',
    heading: 'Vorbereitung',
    content: 'Hier findest du bald Materialien zur Vorbereitung.',
  },
  {
    route: 'seminarveranstaltung',
    heading: 'Seminarveranstaltung',
    content:
      'Das Curriculum für dein Seminar steht leider noch nicht zur Verfügung.',
  },
  {
    route: 'nachbereitung',
    heading: 'Nachbereitung Seminar',
    content:
      'Deine Teilnahme wurde noch nicht freigeschaltet. Bitte wende dich an den Support.',
  },
  {
    route: 'verhandlungsergebnis',
    heading: 'Verhandlungsergebnis',
    content: 'Trage dein Verhandlungsergebnis ein.',
  },
] as const;

test('defines the canonical non-localized step routes', () => {
  expect(stepRoutes.map(step => step.route)).toEqual([
    'vorbereitung',
    'seminarveranstaltung',
    'nachbereitung',
    'verhandlungsergebnis',
  ]);
});

test.describe('Course step routes', () => {
  for (const step of stepRoutes) {
    test(`navigates to ${step.route}`, async ({ page }) => {
      await page.route(`**/my-courses/${bookingId}/${step.route}`, route => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <!DOCTYPE html>
            <html lang="de">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${step.heading} - Hemera Academy</title>
              </head>
              <body>
                <main data-testid="course-step-page">
                  <a href="/dashboard">Zurück zum Dashboard</a>
                  <h1>${step.heading}</h1>
                  <p>Führungskräfte-Coaching</p>
                  <section>
                    <p>${step.content}</p>
                  </section>
                </main>
              </body>
            </html>
          `,
        });
      });

      await page.goto(`/my-courses/${bookingId}/${step.route}`);

      await expect(page).toHaveURL(
        new RegExp(`/my-courses/${bookingId}/${step.route}$`)
      );
      await expect(
        page.getByRole('heading', { level: 1, name: step.heading })
      ).toBeVisible();
      await expect(page.getByText(step.content)).toBeVisible();
    });
  }
});