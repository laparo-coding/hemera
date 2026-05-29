import { describe, expect, it } from '@/tests/vitest/jest-globals';
import { isLikelyCourseId } from '@/lib/utils/courseIdentifier';

describe('isLikelyCourseId', () => {
  it('accepts valid cuid-like course ids', () => {
    expect(isLikelyCourseId('c1234567890abcdefghijklmn')).toBe(true);
  });

  it('rejects ids with the wrong prefix', () => {
    expect(isLikelyCourseId('x1234567890abcdefghijklmn')).toBe(false);
  });

  it('rejects ids with the wrong length', () => {
    expect(isLikelyCourseId('c1234567890abcdefghijklm')).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(isLikelyCourseId('c1234567890abcdefGhijklmn')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isLikelyCourseId('c1234567890abcdefghi_1234')).toBe(false);
  });

  it('rejects empty strings', () => {
    expect(isLikelyCourseId('')).toBe(false);
  });

  it('rejects null values', () => {
    expect(isLikelyCourseId(null as never)).toBe(false);
  });

  it('rejects undefined values', () => {
    expect(isLikelyCourseId(undefined as never)).toBe(false);
  });

  it('accepts digit-only suffixes when the cuid shape still matches', () => {
    expect(isLikelyCourseId(`c${'1'.repeat(24)}`)).toBe(true);
  });

  it('rejects overly long strings', () => {
    expect(isLikelyCourseId(`c${'a'.repeat(50)}`)).toBe(false);
  });
});