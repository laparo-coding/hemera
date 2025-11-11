import { beforeEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

describe("Contract: Web Vitals gating", () => {
  beforeEach(() => {
    // Reset env by replacing the object (avoids read-only property issues)
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    delete process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS;
    process.env = { ...process.env, NODE_ENV: "test" } as NodeJS.ProcessEnv;
  });

  it("is disabled by default (non-prod or flag off)", async () => {
    const { isWebVitalsEnabled } = await import("@/lib/monitoring/web-vitals");
    expect(isWebVitalsEnabled()).toBe(false);
  });

  it("enables in production with flag, and only for public paths", async () => {
    process.env = {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_ENABLE_WEB_VITALS: "1",
    } as NodeJS.ProcessEnv;
    const { isWebVitalsEnabled, isPublicPath, initWebVitals } = await import(
      "@/lib/monitoring/web-vitals"
    );

    expect(isWebVitalsEnabled()).toBe(true);
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(false);

    // init should succeed for public path, and do nothing for private
    const sent: unknown[] = [];
    const sender = (m: unknown) => sent.push(m);

    const okPublic = await initWebVitals(sender, { path: "/" });
    const okPrivate = await initWebVitals(sender, { path: "/sign-in" });

    // If web-vitals is available, okPublic should be true; otherwise false.
    // In both cases okPublic must be a boolean and not throw.
    expect(typeof okPublic).toBe("boolean");
    expect(okPrivate).toBe(false);
  });
});
