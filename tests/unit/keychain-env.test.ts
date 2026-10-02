import { describe, expect, it } from 'vitest';
// @ts-expect-error mjs without types
import { resolveKeychainEnv } from '../../lib/keychain-env.mjs';

describe('resolveKeychainEnv', () => {
  it('keeps existing values and ignores non-darwin', () => {
    const env: Record<string, string> = { A: 'x', A_KEYCHAIN_SERVICE: 's', B_KEYCHAIN_SERVICE: 's' };
    resolveKeychainEnv(env, 'linux');
    expect(env.A).toBe('x');
    expect(env.B).toBeUndefined();
  });
});
