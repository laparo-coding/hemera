import { describe, expect, it } from "@jest/globals";

describe("de-DE Intl formatting", () => {
  it("formats EUR currency with comma decimals", () => {
    const amountCents = 12345; // 123,45 €
    const formatted = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amountCents / 100);

    expect(formatted).toMatch(/\d{1,3}([.\s]\d{3})*,\d{2}\s?€/);
    expect(formatted.includes(",")).toBeTruthy();
  });

  it("formats date in German locale", () => {
    const date = new Date("2025-12-24T12:00:00Z");
    const formatted = new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(date);

    // e.g., "24. Dezember 2025" (depending on environment, dot spacing may vary)
    expect(formatted).toMatch(/\d{2}\.\s?\w+\s\d{4}/);
  });
});
