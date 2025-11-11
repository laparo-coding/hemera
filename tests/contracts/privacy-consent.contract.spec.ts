import { beforeEach, describe, expect, it } from "@jest/globals";

describe("Contract: Privacy/Consent default OFF (no PII)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reset env and module registry before each test
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_TELEMETRY_CONSENT;
    delete process.env.TELEMETRY_CONSENT;
    delete process.env.ROLLBAR_ALLOW_PII;
    // No module mocking; we reload module by dynamic import when needed
  });

  it("does not include person when consent is not granted", async () => {
    const mod = await import("@/lib/monitoring/rollbar-official");
    // Monkey patch serverInstance.error to capture payload
    const calls: any[] = [];
    const originalError = mod.serverInstance.error.bind(mod.serverInstance);
    (mod.serverInstance as any).error = (msg: any, payload: any) => {
      calls.push([msg, payload]);
    };

    mod.reportError("Test Error", {
      userId: "user-123",
      userEmail: "user@example.com",
      requestId: "req-1",
      route: "/test",
      method: "GET",
    });

    expect(calls.length).toBe(1);
    const [, payload] = calls[0];
    expect(payload.person).toBeUndefined();

    // restore
    (mod.serverInstance as any).error = originalError;
  });
});
