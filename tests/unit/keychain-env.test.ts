import { beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error mjs without types
import { resolveKeychainEnv } from '../../lib/keychain-env.mjs';

const { mockExecFileSync } = vi.hoisted(() => ({ mockExecFileSync: vi.fn() }));

// Vitest 5 requires a `default` export on mocked node: builtins.
vi.mock('node:child_process', () => ({
  default: { execFileSync: mockExecFileSync },
  execFileSync: mockExecFileSync,
}));

describe('resolveKeychainEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps existing values and ignores non-darwin', () => {
    const env: Record<string, string> = { A: 'x', A_KEYCHAIN_SERVICE: 's', B_KEYCHAIN_SERVICE: 's' };
    resolveKeychainEnv(env, 'linux');
    expect(env.A).toBe('x');
    expect(env.B).toBeUndefined();
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it('loads and trims a Keychain value on Darwin', () => {
    mockExecFileSync.mockReturnValue('  secret-value \n');
    const env: Record<string, string> = { API_KEY_KEYCHAIN_SERVICE: 'api-key' };

    resolveKeychainEnv(env, 'darwin');

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'security',
      ['find-generic-password', '-s', 'api-key', '-w'],
      expect.objectContaining({ timeout: 5000 })
    );
    expect(env.API_KEY).toBe('secret-value');
  });

  it('leaves the variable unset when the Keychain value is empty', () => {
    mockExecFileSync.mockReturnValue(' \n ');
    const env: Record<string, string> = { API_KEY_KEYCHAIN_SERVICE: 'api-key' };

    resolveKeychainEnv(env, 'darwin');

    expect(env.API_KEY).toBeUndefined();
  });

  it('leaves the variable unset and warns without exposing a secret on error', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('Keychain unavailable');
    });
    const warn = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
    const env: Record<string, string> = { API_KEY_KEYCHAIN_SERVICE: 'api-key' };

    resolveKeychainEnv(env, 'darwin');

    expect(env.API_KEY).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'Unable to read Keychain entry for API_KEY: Keychain unavailable'
    );
    warn.mockRestore();
  });

  it('replaces empty and whitespace-only existing values on Darwin', () => {
    mockExecFileSync.mockReturnValueOnce('first-secret').mockReturnValueOnce('second-secret');
    const env: Record<string, string> = {
      EMPTY: '',
      EMPTY_KEYCHAIN_SERVICE: 'empty',
      SPACES: '   ',
      SPACES_KEYCHAIN_SERVICE: 'spaces',
    };

    resolveKeychainEnv(env, 'darwin');

    expect(env.EMPTY).toBe('first-secret');
    expect(env.SPACES).toBe('second-secret');
  });

  it('preserves non-empty existing values on Darwin', () => {
    const env: Record<string, string> = {
      API_KEY: 'already-set',
      API_KEY_KEYCHAIN_SERVICE: 'api-key',
    };

    resolveKeychainEnv(env, 'darwin');

    expect(env.API_KEY).toBe('already-set');
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });
});
