import { describe, expect, it } from '@jest/globals';
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
});