import { describe, expect, it } from '@jest/globals';
import { getClerkKeyMismatchReason } from '@/lib/auth/clerk-key-validation';

describe('getClerkKeyMismatchReason', () => {
  it('returns null for matching test keys', () => {
    expect(
      getClerkKeyMismatchReason('pk_test_abc123', 'sk_test_def456')
    ).toBeNull();
  });

  it('returns null for matching live keys', () => {
    expect(
      getClerkKeyMismatchReason('pk_live_abc123', 'sk_live_def456')
    ).toBeNull();
  });

  it('returns a bypass reason for mixed test and live keys', () => {
    expect(
      getClerkKeyMismatchReason('pk_test_abc123', 'sk_live_def456')
    ).toContain('passen nicht zusammen');
  });

  it('returns a bypass reason for mixed live and test keys', () => {
    expect(
      getClerkKeyMismatchReason('pk_live_abc123', 'sk_test_def456')
    ).toContain('passen nicht zusammen');
  });

  it('ignores incomplete or non-standard values', () => {
    expect(getClerkKeyMismatchReason(undefined, 'sk_live_def456')).toBeNull();
    expect(getClerkKeyMismatchReason('foo', 'bar')).toBeNull();
  });
});