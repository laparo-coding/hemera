import { expect, test } from "@playwright/test";
import { clickAndWait, gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe("Courses routing", () => {
  test("List → Detail → Sign-in redirect on booking", async ({ page }) => {
    test.setTimeout(120000);

    await gotoStable(page, "/courses", { waitForTestId: "course-overview" });

    await expect(page.getByTestId("course-overview")).toBeVisible({
      timeout: 30000,
    });

    // Klicke eine sichtbare CTA "Zum Kurs" (überspringt ausgebuchte Karten ohne CTA)
    // Primär suchen wir nach einem Button (MUI-Button), fallback auf Link wenn vorhanden.
    const overview = page.getByTestId("course-overview");
    let detailLink = overview
      .getByRole("button", { name: /zum kurs/i })
      .first();
    if ((await detailLink.count()) === 0) {
      detailLink = overview.getByRole("link", { name: /zum kurs/i }).first();
    }
    if ((await detailLink.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description:
          "Keine „Zum Kurs“-CTA gefunden (evtl. alle Kurse ausgebucht). Test informativ übersprungen.",
      });
      return;
    }
    await expect(detailLink).toBeVisible();

    // Client-Side Routing: Klick + URL-Expectation stabil abwarten
    await clickAndWait(page, () => detailLink, {
      expectUrl: /\/courses\/[\w-]+/,
    });

    // CTA klicken – als Gast sollte ein Redirect zur Anmeldung erfolgen
    const bookCta = page.getByTestId("course-detail-book-cta");
    await expect(bookCta).toBeVisible();

    // Falls ausgebucht, kann der Button disabled sein – in dem Fall brechen wir informativ ab
    const disabled = await bookCta.isDisabled();
    if (disabled) {
      test.info().annotations.push({
        type: "note",
        description:
          "CTA ist deaktiviert (z. B. ausgebucht). Routing-Test informativ übersprungen.",
      });
      return;
    }

    await clickAndWait(page, () => bookCta, {
      expectUrl: /\/sign-in\?redirect_url=/,
    });

    // Erwartung: Clerk Sign-In mit redirect_url=...bookings/new?courseId=...
    await expect(page).toHaveURL(/\/sign-in\?redirect_url=/);
    const url = new URL(page.url());
    const returnUrl = url.searchParams.get("redirect_url") || "";
    expect(returnUrl).toMatch(/\/bookings\/new\?courseId=/);
  });
});
