import { expect, test } from "@playwright/test";
import { clickAndWait, gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

test.describe("Course detail JSON-LD", () => {
	test("enthält strukturierte Daten (application/ld+json)", async ({
		page,
	}) => {
		await gotoStable(page, "/courses", { waitForTestId: "course-overview" });

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

		await clickAndWait(page, () => detailLink, {
			expectUrl: /\/courses\/[\w-]+/,
		});

		const jsonLdScripts = page.locator('script[type="application/ld+json"]');
		const count = await jsonLdScripts.count();
		expect(count).toBeGreaterThan(0);

		// Mindestens eines der JSON-LD-Snippets sollte ein Course/Offer enthalten
		const contents: string[] = [];
		for (let i = 0; i < count; i++) {
			const txt = await jsonLdScripts.nth(i).textContent();
			if (txt) contents.push(txt);
		}

		const hasCourse = contents.some((c) => /"@type"\s*:\s*"Course"/.test(c));
		expect(hasCourse).toBeTruthy();

		const hasOffer = contents.some((c) => /"@type"\s*:\s*"Offer"/.test(c));
		expect(hasOffer).toBeTruthy();

		const hasEur = contents.some((c) => /"priceCurrency"\s*:\s*"EUR"/.test(c));
		expect(hasEur).toBeTruthy();

		const hasAvailability = contents.some((c) =>
			/https:\/\/schema\.org\/(InStock|OutOfStock)/.test(c),
		);
		expect(hasAvailability).toBeTruthy();
	});
});
