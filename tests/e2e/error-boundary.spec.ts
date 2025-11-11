import { expect, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

// This test relies on E2E_TEST=true and NEXT_PUBLIC_ROLLBAR_ENABLED=0.
// It navigates to a dedicated crash page which throws, then asserts
// the German error UI is shown from app/error.tsx or global-error.tsx.

test.describe("Fehlergrenzen (Error Boundaries)", () => {
  // In production runs against external BASE_URL the /e2e/crash page returns 404
  // because E2E_TEST is not set on the remote server. Skip in that case.
  test.skip(
    !!process.env.PLAYWRIGHT_BASE_URL,
    "Skip on external BASE_URL (no E2E_TEST)",
  );

  test("zeigt deutsche Fehlermeldung und Buttons", async ({ page }) => {
    await gotoStable(page, "/e2e/crash");

    // Headline text from error.tsx
    await expect(
      page.getByRole("heading", { name: "Ein Fehler ist aufgetreten" }),
    ).toBeVisible({ timeout: 10_000 });

    // Buttons in German
    await expect(
      page.getByRole("button", { name: "Erneut versuchen" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "Zur Startseite" }),
    ).toBeVisible({ timeout: 10_000 });

    // Snapshot of body text exists in German
    await expect(page.getByText(/Bitte versuche es erneut\./)).toBeVisible({
      timeout: 10_000,
    });
  });
});
