import { expect, type Page, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

async function getMetaContent(page: Page, selector: string) {
	const el = page.locator(selector).first();
	if ((await el.count()) === 0) return null;
	return await el.getAttribute("content");
}

test.describe("Academy OpenGraph & Twitter", () => {
	test("OG & Twitter-Meta sind vorhanden und plausibel", async ({ page }) => {
		await gotoStable(page, "/academy");

		const ogTitle = await getMetaContent(page, 'meta[property="og:title"]');
		const ogDesc = await getMetaContent(
			page,
			'meta[property="og:description"]',
		);
		const ogType = await getMetaContent(page, 'meta[property="og:type"]');

		expect(ogTitle).toMatch(/Hemera Academy/i);
		expect(ogDesc).toBeTruthy();
		expect(ogType === "website" || ogType === "article").toBeTruthy();

		const twCard = await getMetaContent(page, 'meta[name="twitter:card"]');
		const twTitle = await getMetaContent(page, 'meta[name="twitter:title"]');
		const twSite = await getMetaContent(page, 'meta[name="twitter:site"]');

		expect(twCard).toBeTruthy();
		expect(twTitle).toMatch(/Hemera Academy/i);
		// twSite optional abhängig von ENV, hier nur Plausibilität wenn vorhanden
		if (twSite) expect(twSite).toMatch(/@/);
	});
});
