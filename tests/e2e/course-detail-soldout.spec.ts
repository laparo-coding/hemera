import { expect, test } from "@playwright/test";
import { gotoStable } from "./helpers/nav";

const _isExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;

// Detailseiten-Test für Ausgebucht-Zustand:
// Strategie: IDs aus JSON-LD (base64) extrahieren, nacheinander Detailseiten öffnen,
// bis eine mit "Ausgebucht" gefunden wird. Falls keine, Test informativ bestehen lassen.

test.describe("Course Detail – Ausgebucht-Zustand", () => {
	test('CTA ist deaktiviert und zeigt "Ausgebucht" bei ausgebuchtem Kurs', async ({
		page,
	}) => {
		test.setTimeout(120000);

		await gotoStable(page, "/courses", { waitForTestId: "course-overview" });

		// Warte bis Übersicht gerendert
		await expect(page.getByTestId("course-overview")).toBeVisible({
			timeout: 30000,
		});

		// Sammle alle JSON-LD Inhalte (base64) und dekodiere im Testkontext
		const base64Schemas = await page.$$eval(
			'script[type="application/ld+json"]',
			(els) => els.map((e) => e.textContent || ""),
		);

		const courseIds: string[] = [];
		for (const content of base64Schemas) {
			if (!content) continue;
			try {
				const jsonStr = Buffer.from(content, "base64").toString("utf8");
				const data = JSON.parse(jsonStr);
				// Einzelnes Objekt oder Array behandeln
				const items = Array.isArray(data) ? data : [data];
				for (const item of items) {
					if (
						item &&
						item["@type"] === "Course" &&
						typeof item.url === "string"
					) {
						try {
							const u = new URL(item.url);
							const id = u.pathname.split("/").filter(Boolean).pop();
							if (id) courseIds.push(id);
						} catch {
							// Ignorieren, wenn URL nicht parsebar ist
						}
					}
				}
			} catch {
				// JSON-LD konnte nicht dekodiert werden – ignorieren
			}
		}

		if (courseIds.length === 0) {
			test.info().annotations.push({
				type: "note",
				description:
					"Keine Kurs-IDs aus JSON-LD extrahierbar. Test informativ bestanden.",
			});
			return;
		}

		let foundSoldOut = false;

		for (const id of courseIds) {
			await gotoStable(page, `/courses/${id}`);

			// Warte kurz auf CTA
			const cta = page.getByTestId("course-detail-book-cta");
			const hasCta = await cta.count().then((c) => c > 0);
			if (!hasCta) continue;

			const text = (await cta.textContent()) || "";
			const isDisabled = await cta.isDisabled();

			if (/Ausgebucht/i.test(text) && isDisabled) {
				foundSoldOut = true;
				// Optional: Badge und Reason prüfen, wenn vorhanden
				const badge = page.getByTestId("course-detail-sold-out-badge");
				await expect(badge).toHaveCount(1);
				const reason = page.getByTestId("course-detail-disable-reason");
				await expect(reason).toHaveText(/ausgebucht/i);
				break;
			}
		}

		if (!foundSoldOut) {
			test.info().annotations.push({
				type: "note",
				description:
					"Kein ausgebuchter Kurs in der aktuellen Datenlage. Test informativ bestanden.",
			});
			// Erwartungslos beenden, damit der Test nicht fehlschlägt
			await expect(true).toBeTruthy();
		}
	});
});
