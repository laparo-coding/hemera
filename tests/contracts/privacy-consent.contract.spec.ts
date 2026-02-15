import { beforeEach, describe, expect, it } from '@jest/globals';

describe('Contract: Privacy/Consent default OFF (no PII)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reset env and module registry before each test
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_TELEMETRY_CONSENT;
    delete process.env.TELEMETRY_CONSENT;
    delete process.env.ROLLBAR_ALLOW_PII;
    process.env.NEXT_PUBLIC_ROLLBAR_ENABLED = '1'; // explizit Rollbar aktivieren
    // No module mocking; we reload module by dynamic import when needed
  });

  it('does not include person when consent is not granted', async () => {
    const mod = await import('../../lib/monitoring/rollbar-official');
    // Monkey patch alle Methoden von serverInstance, um alle Severity-Fälle zu erfassen
    const calls: any[] = [];
    const orig: Record<string, any> = {};
    for (const method of ['error', 'warning', 'info', 'critical', 'debug']) {
      orig[method] = (mod.serverInstance as any)[method];
      (mod.serverInstance as any)[method] = (msg: any, payload: any) => {
        calls.push([msg, payload]);
      };
    }

    mod.reportError('Test Error', {
      userId: 'user-123',
      userEmail: 'user@example.com',
      requestId: 'req-1',
      route: '/test',
      method: 'GET',
    });

    expect(calls.length).toBe(1);
    const [, payload] = calls[0];
    expect(payload.person).toBeUndefined();

    // restore
    for (const method of ['error', 'warning', 'info', 'critical', 'debug']) {
      (mod.serverInstance as any)[method] = orig[method];
    }
  });
});
