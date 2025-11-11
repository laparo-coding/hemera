import { expect, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

// Verifies that legacy /protected/* paths are permanently redirected to /dashboard
// The rule is configured in next.config.mjs

test.describe("legacy /protected redirect", () => {
  test.skip(
    !!process.env.PLAYWRIGHT_BASE_URL,
    "Skip on external BASE_URL where platform caching/edge may bypass app middleware.",
  );
  test("permanent redirect to /dashboard", async ({ page, baseURL }) => {
    const resp = await gotoStable(page, "/protected/foo");
    expect(resp).not.toBeNull();
    // Playwright follows redirects by default; check final URL
    await expect(page).toHaveURL(new RegExp(`${baseURL}/dashboard/?$`));
  });
});
