import { afterEach, beforeEach, describe, expect, it } from '@/tests/vitest/jest-globals';
import { extractApiKey, validateServiceApiKey } from '@/lib/auth/service-api-key';

describe('service-api-key', () => {
  const originalApiKey = process.env.HEMERA_SERVICE_API_KEY;
  const originalServiceUserId = process.env.HEMERA_SERVICE_USER_ID;

  beforeEach(() => {
    process.env.HEMERA_SERVICE_USER_ID = 'svc_user_123';
  });

  afterEach(() => {
    process.env.HEMERA_SERVICE_API_KEY = originalApiKey;
    process.env.HEMERA_SERVICE_USER_ID = originalServiceUserId;
  });

  it('accepts a configured service api key', () => {
    process.env.HEMERA_SERVICE_API_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    expect(validateServiceApiKey('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toEqual({
      userId: 'svc_user_123',
      role: 'api-client',
    });
  });

  it('rejects a non-matching service api key', () => {
    process.env.HEMERA_SERVICE_API_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    expect(validateServiceApiKey('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBeNull();
  });

  it('rejects candidate keys shorter than 32 characters', () => {
    process.env.HEMERA_SERVICE_API_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    expect(validateServiceApiKey('short_key')).toBeNull();
  });

  it('rejects valid key when service user id is missing', () => {
    const validKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    process.env.HEMERA_SERVICE_API_KEY = validKey;
    process.env.HEMERA_SERVICE_USER_ID = '';

    expect(validateServiceApiKey(validKey)).toBeNull();
  });

  it('accepts a 256-character service api key boundary value', () => {
    const veryLongKey = 'a'.repeat(256);
    process.env.HEMERA_SERVICE_API_KEY = veryLongKey;

    expect(validateServiceApiKey(veryLongKey)).toEqual({
      userId: 'svc_user_123',
      role: 'api-client',
    });
  });

  it('supports comma-separated keys for simple rotation', () => {
    process.env.HEMERA_SERVICE_API_KEY = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ].join(',');

    expect(validateServiceApiKey('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toEqual({
      userId: 'svc_user_123',
      role: 'api-client',
    });
  });

  it('extracts x-api-key headers', () => {
    const headers = new Headers({
      'x-api-key': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    expect(extractApiKey(headers)).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});