import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe("Courses SEO & A11y", () => {
	test("JSON-LD vorhanden und A11y ohne kritische Verstöße", async ({
		page,
	}) => {
		test.setTimeout(120000);

		await gotoStable(page, "/courses", { waitForTestId: "course-overview" });

		// Warte darauf, dass mindestens ein JSON-LD Script geladen ist
		await page.waitForSelector('script[type="application/ld+json"]', {
			state: "attached",
			timeout: 10000,
		});

		// SEO: JSON-LD vorhanden und parsebar (plain JSON)
		const jsonSchemas = await page.$$eval(
			'script[type="application/ld+json"]',
			(els) => els.map((e) => e.textContent || ""),
		);

		expect(jsonSchemas.length).toBeGreaterThan(0);

		let parsedAny = false;
		for (const content of jsonSchemas) {
			if (!content) continue;
			try {
				const data = JSON.parse(content);
				const items = Array.isArray(data) ? data : [data];
				for (const item of items) {
					if (item && typeof item["@context"] === "string") {
						parsedAny = true;
						break;
					}
				}
			} catch {
				// ignore malformed
			}
			if (parsedAny) break;
		}
		expect(parsedAny).toBeTruthy();

		// A11y: Axe-Scan (nur schwere Verstöße failen lassen)
		const results = await new AxeBuilder({ page }).analyze();

		const critical = (results.violations || []).filter(
			(v) => v.impact === "critical",
		);
		if (critical.length) {
			console.error(
				"Critical A11y violations:",
				critical.map((v) => v.id),
			);
		}
		expect(critical.length).toBe(0);
	});
});
