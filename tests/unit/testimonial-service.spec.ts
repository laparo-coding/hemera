/**
 * Testimonial Service Unit Tests
 * Feature: 017-testimonial-management
 *
 * Tests for testimonial service functions
 */

import {
  formatDisplayName,
  isFormatOptionAvailable,
} from '@/lib/schemas/testimonial-schema';

describe('formatDisplayName', () => {
  const testCases = [
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      city: 'Berlin',
      format: 'FULL_NAME_CITY' as const,
      expected: 'Max Mustermann, Berlin',
    },
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      city: null,
      format: 'FULL_NAME_CITY' as const,
      expected: 'Max Mustermann', // Falls back when no city
    },
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      city: 'Berlin',
      format: 'FULL_NAME' as const,
      expected: 'Max Mustermann',
    },
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      city: 'Berlin',
      format: 'FIRST_INITIAL' as const,
      expected: 'Max M.',
    },
    {
      firstName: 'Max',
      lastName: '',
      city: 'Berlin',
      format: 'FIRST_INITIAL' as const,
      expected: 'Max .', // charAt(0) on empty string returns ''
    },
    {
      firstName: 'Max',
      lastName: 'Mustermann',
      city: 'Berlin',
      format: 'FIRST_NAME_ONLY' as const,
      expected: 'Max',
    },
    {
      firstName: '',
      lastName: 'Mustermann',
      city: null,
      format: 'FULL_NAME' as const,
      expected: ' Mustermann', // Space + lastName when firstName empty
    },
  ];

  testCases.forEach(({ firstName, lastName, city, format, expected }) => {
    it(`formats "${firstName} ${lastName}" with city "${city}" as ${format} to "${expected}"`, () => {
      const result = formatDisplayName(firstName, lastName, city, format);
      expect(result).toBe(expected);
    });
  });

  it('handles empty first and last name', () => {
    const result = formatDisplayName('', '', null, 'FULL_NAME');
    expect(result).toBe(' '); // Returns space between empty names
  });

  it('FIRST_INITIAL handles empty last name correctly', () => {
    // The function returns "FirstName ." when lastName is empty
    const result = formatDisplayName('Max', '', null, 'FIRST_INITIAL');
    expect(result).toBe('Max .');
  });
});

describe('isFormatOptionAvailable', () => {
  it('returns true for FULL_NAME_CITY when hasCity is true', () => {
    expect(isFormatOptionAvailable('FULL_NAME_CITY', true)).toBe(true);
  });

  it('returns false for FULL_NAME_CITY when hasCity is false', () => {
    expect(isFormatOptionAvailable('FULL_NAME_CITY', false)).toBe(false);
  });

  it('returns true for FULL_NAME regardless of city', () => {
    expect(isFormatOptionAvailable('FULL_NAME', false)).toBe(true);
    expect(isFormatOptionAvailable('FULL_NAME', true)).toBe(true);
  });

  it('returns true for FIRST_INITIAL regardless of city', () => {
    expect(isFormatOptionAvailable('FIRST_INITIAL', false)).toBe(true);
  });

  it('returns true for FIRST_NAME_ONLY regardless of city', () => {
    expect(isFormatOptionAvailable('FIRST_NAME_ONLY', false)).toBe(true);
  });
});
