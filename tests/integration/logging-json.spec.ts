import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@/tests/vitest/jest-globals';

// We will capture Rollbar.info payloads via the serverInstance mock (no-op in tests)
import { serverInstance } from '../../lib/monitoring/rollbar-official';
import { createApiLogger } from '../../lib/utils/api-logger';
import type { RequestContext } from '../../lib/utils/request-id';

describe('Integration: Structured JSON logging with requestId', () => {
  const calls: Array<{ message: string; payload: any }> = [];
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    calls.length = 0;
    process.env.NODE_ENV = 'development';
    // Patch info to capture the structured payload the ApiLogger sends
    (serverInstance as any).info = (message: string, payload: any) => {
      calls.push({ message, payload });
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs info with requestId, timestamp and message', () => {
    const ctx: RequestContext = {
      id: 'req-abc123',
      timestamp: new Date().toISOString(),
      method: 'GET',
      url: '/api/demo',
    };

    const logger = createApiLogger(ctx);
    logger.info('Demo event', { foo: 'bar' });

    expect(calls).toHaveLength(1);
    const entry = calls[0]!;
    expect(entry.message).toBe('Demo event');
    expect(entry.payload).toBeDefined();
    // our ApiLogger puts requestId and context in the payload
    expect(entry.payload.requestId).toBe(ctx.id);
    expect(entry.payload.context).toBeDefined();
    expect(entry.payload.context!.id).toBe(ctx.id);
    // timestamp is set by logger
    expect(typeof entry.payload.timestamp).toBe('string');
  });
});
