import { expect, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe("Academy page", () => {
	test.beforeAll(async ({ request }) => {
		// Warmup: tolerant und mit kurzem Timeout, um den Dev-Server nicht zu überlasten
		try {
			await request.get("http://localhost:3000/", { timeout: 3000 });
			await request.get("http://localhost:3000/academy", { timeout: 3000 });
		} catch {
			// best-effort: Ignorieren, falls Server noch startet
		}
	});

	test("renders and links to courses with correct metadata", async ({
		page,
	}) => {
		await gotoStable(page, "/academy");

		await expect(
			page.getByRole("heading", { level: 1, name: /hemera academy/i }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: /alle kurse/i })).toBeVisible();
		await expect(
			page.getByRole("link", { name: /kurse entdecken/i }),
		).toBeVisible();

		const title = await page.title();
		expect(title).toMatch(/Hemera Academy/i);
	});
});
