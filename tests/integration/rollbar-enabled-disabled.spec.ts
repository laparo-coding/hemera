import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const ORIGINAL_ENV = process.env;

describe('Integration: Rollbar enabled/disabled behavior', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    delete process.env.NEXT_PUBLIC_DISABLE_ROLLBAR;
    delete process.env.NEXT_PUBLIC_ROLLBAR_ENABLED;
    delete process.env.ROLLBAR_ENABLED;
    jest.resetModules();
  });

  it('does not send when explicitly disabled', async () => {
    process.env = {
      ...process.env,
      ROLLBAR_ENABLED: '0',
    } as NodeJS.ProcessEnv;

    const mod = await import('@/lib/monitoring/rollbar-official');
    const calls: any[] = [];
    (mod.serverInstance as any).error = (msg: any, payload: any) =>
      calls.push([msg, payload]);

    mod.reportError('Disabled Error', { requestId: 'r1' });
    expect(calls.length).toBe(0);
  });

  it('sends when enabled (default) and not explicitly disabled', async () => {
    const mod = await import('@/lib/monitoring/rollbar-official');
    const calls: any[] = [];
    (mod.serverInstance as any).error = (msg: any, payload: any) =>
      calls.push([msg, payload]);

    mod.reportError('Enabled Error', { requestId: 'r2' });
    expect(calls.length).toBe(1);
    const [msg, payload] = calls[0];
    expect(msg).toBe('Enabled Error');
    expect(payload?.request?.id).toBe('r2');
  });
});
