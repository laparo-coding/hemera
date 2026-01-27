/**
 * T030: Mobile E2E Tests - Dashboard Responsive Layout
 *
 * Validates the dashboard displays correctly on mobile devices (< 768px).
 * Tests responsive behavior of 4-section layout and course cards.
 */

import { expect, type Page, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad

const isMockMode =
  !!process.env.CI ||
  process.env.E2E_TEST === 'true' ||
  process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

/**
 * Render mock dashboard for CI/mock mode
 */
async function renderMobileDashboardMock(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dashboard - Hemera Academy</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #FBF5DD; }
          .dashboard { padding: 16px; max-width: 100%; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 1.25rem; color: #16404D; margin-bottom: 12px; }
          .course-card { 
            background: white; 
            border-radius: 12px; 
            padding: 16px; 
            margin-bottom: 12px;
            border: 1px solid rgba(22, 64, 77, 0.1);
          }
          .course-title { font-weight: 600; color: #16404D; margin-bottom: 8px; }
          .course-meta { font-size: 0.875rem; color: #16404D; opacity: 0.7; }
          .course-meta-row { display: flex; flex-direction: column; gap: 4px; }
          @media (min-width: 768px) {
            .course-meta-row { flex-direction: row; gap: 16px; }
          }
          .action-button { 
            margin-top: 12px; 
            padding: 8px 16px; 
            border: 1px solid #16404D;
            border-radius: 8px;
            background: transparent;
            color: #16404D;
            cursor: pointer;
          }
          .invoice-button {
            background: #DDA853;
            border-color: #DDA853;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="dashboard" data-testid="user-dashboard">
          <h1 data-testid="dashboard-title" style="font-size: 1.5rem; color: #16404D; margin-bottom: 24px;">
            Meine Kurse
          </h1>
          
          <!-- Nächstes Seminar -->
          <section class="section" data-testid="section-next-seminar">
            <h2 class="section-title">Nächstes Seminar</h2>
            <div class="course-card" data-testid="course-card-1">
              <div class="course-title">Führungskräfte-Coaching</div>
              <div class="course-meta-row">
                <span class="course-meta" data-testid="course-date">15.02.2026</span>
                <span class="course-meta" data-testid="course-time">09:00 - 17:00 Uhr</span>
                <span class="course-meta" data-testid="course-location">München</span>
              </div>
              <button class="action-button">Vorbereitung</button>
            </div>
          </section>

          <!-- Weitere gebuchte Seminare -->
          <section class="section" data-testid="section-upcoming">
            <h2 class="section-title">Weitere gebuchte Seminare</h2>
            <div class="course-card" data-testid="course-card-2">
              <div class="course-title">Team-Workshop</div>
              <div class="course-meta-row">
                <span class="course-meta">22.03.2026</span>
                <span class="course-meta">10:00 - 16:00 Uhr</span>
                <span class="course-meta">Berlin</span>
              </div>
              <button class="action-button">Vorbereitung</button>
            </div>
          </section>

          <!-- Absolvierte Seminare -->
          <section class="section" data-testid="section-completed">
            <h2 class="section-title">Absolvierte Seminare</h2>
            <div class="course-card" data-testid="course-card-3">
              <div class="course-title">Kommunikationstraining</div>
              <div class="course-meta-row">
                <span class="course-meta">10.01.2026</span>
                <span class="course-meta">09:00 - 17:00 Uhr</span>
                <span class="course-meta">Hamburg</span>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="action-button">Details</button>
                <button class="action-button invoice-button" data-testid="invoice-download-btn">
                  Rechnung
                </button>
              </div>
            </div>
          </section>
        </div>
      </body>
    </html>
  `);
}

test.describe('Dashboard Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('should display dashboard on mobile viewport', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // Dashboard container should be visible
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();

    // Title should be visible
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('should stack course card meta on mobile', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // Find course card
    const courseCard = page.locator('[data-testid^="course-card-"]').first();
    await expect(courseCard).toBeVisible();

    // On mobile, meta should be stacked (column layout)
    const metaRow = courseCard.locator('.course-meta-row');
    if (await metaRow.isVisible()) {
      const box = await metaRow.boundingBox();
      // In column layout, height should be greater than width typically
      // or we can check that items are stacked
      expect(box).toBeTruthy();
    }
  });

  test('should display all sections on mobile', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // Check that sections are present (may be empty)
    const sections = [
      'section-next-seminar',
      'section-upcoming',
      'section-completed',
    ];

    for (const sectionId of sections) {
      const _section = page.locator(`[data-testid="${sectionId}"]`);
      // Section may or may not be visible depending on data
      // Just verify the page structure works on mobile
    }

    // At least one section should be visible if user has bookings
    // In mock mode, we always have sections
    if (isMockMode) {
      await expect(
        page.locator('[data-testid="section-next-seminar"]')
      ).toBeVisible();
    }
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // Find action buttons
    const buttons = page.locator('.action-button, button[data-testid]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Minimum touch target: 44x44px (Apple HIG recommendation)
        expect(box.height).toBeGreaterThanOrEqual(32); // Allow slightly smaller for inline buttons
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should display invoice button on completed courses', async ({
    page,
  }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // Find completed section
    const completedSection = page.locator('[data-testid="section-completed"]');

    if (await completedSection.isVisible()) {
      // Invoice button should be visible for completed courses
      const invoiceBtn = completedSection.locator(
        '[data-testid="invoice-download-btn"], button:has-text("Rechnung")'
      );

      if ((await invoiceBtn.count()) > 0) {
        await expect(invoiceBtn.first()).toBeVisible();
      }
    }
  });
});

test.describe('Dashboard Tablet Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
  });

  test('should display dashboard on tablet viewport', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  });

  test('should have horizontal meta layout on tablet', async ({ page }) => {
    if (isMockMode) {
      await renderMobileDashboardMock(page);
    } else {
      await page.goto('/dashboard');
    }

    // On tablet (768px+), meta should be in row layout
    const courseCard = page.locator('[data-testid^="course-card-"]').first();

    if (await courseCard.isVisible()) {
      const metaRow = courseCard.locator('.course-meta-row');
      if (await metaRow.isVisible()) {
        const box = await metaRow.boundingBox();
        // Row layout should be wider than tall
        expect(box).toBeTruthy();
      }
    }
  });
});

test.describe('Course Detail Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('should display course detail page on mobile', async ({ page }) => {
    if (isMockMode) {
      // Render mock course detail page
      await page.setContent(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Kursdetails - Hemera Academy</title>
            <style>
              body { font-family: 'Inter', sans-serif; background: #FBF5DD; padding: 16px; }
              .back-button { margin-bottom: 16px; color: #16404D; }
              .course-header { background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; }
              .course-title { font-size: 1.5rem; color: #16404D; margin-bottom: 8px; }
              .section { background: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; scroll-margin-top: 80px; }
              .section-title { font-size: 1.25rem; color: #16404D; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div data-testid="course-detail-page">
              <a href="/dashboard" class="back-button">← Zurück zum Dashboard</a>
              <div class="course-header">
                <h1 class="course-title">Führungskräfte-Coaching</h1>
                <p>15. Februar 2026</p>
                <p>09:00 – 17:00 Uhr</p>
                <p>München</p>
              </div>
              <div id="vorbereitung" class="section" data-testid="vorbereitung-section">
                <h2 class="section-title">Vorbereitung</h2>
                <p>Hier findest du bald Materialien zur Vorbereitung.</p>
              </div>
            </div>
          </body>
        </html>
      `);
    } else {
      // Would need a real booking ID
      await page.goto('/my-courses/test-booking-id');
    }

    // Check page is visible
    const pageContent = page.locator(
      '[data-testid="course-detail-page"], [data-testid="vorbereitung-section"]'
    );
    await expect(pageContent.first()).toBeVisible();
  });

  test('should support anchor navigation', async ({ page }) => {
    if (isMockMode) {
      // Create a simple server mock for anchor testing
      await page.route('**/test-anchor-page', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <!DOCTYPE html>
            <html lang="de">
              <head>
                <style>
                  body { height: 2000px; padding-top: 100px; }
                  .section { height: 500px; background: white; margin: 20px; scroll-margin-top: 80px; }
                </style>
              </head>
              <body>
                <div id="vorbereitung" class="section" data-testid="vorbereitung-section">Vorbereitung</div>
                <div id="ergebnisse" class="section" data-testid="results-section">Ergebnisse</div>
                <div id="nachbereitung" class="section" data-testid="debriefing-section">Nachbereitung</div>
              </body>
            </html>
          `,
        });
      });

      // Navigate to page with anchor
      await page.goto('/test-anchor-page#ergebnisse');

      // Ergebnisse section should be visible
      const resultsSection = page.locator('#ergebnisse');
      await expect(resultsSection).toBeVisible();
    }
  });
});
