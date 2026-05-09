import { describe, expect, it } from '@jest/globals';
import { getAdminCourseEditUrl, getCourseUrl } from '@/lib/utils/course-url';

describe('getCourseUrl', () => {
  it('uses the trimmed and encoded slug when present', () => {
    expect(getCourseUrl({ id: 'course-1', slug: ' grundkurs intensiv ' })).toBe(
      '/courses/grundkurs%20intensiv'
    );
  });

  it('falls back to the course id when slug is missing', () => {
    expect(getCourseUrl({ id: 'course-1' })).toBe('/courses/course-1');
  });

  it('falls back to the course id when slug is blank', () => {
    expect(getCourseUrl({ id: 'course-1', slug: '   ' })).toBe(
      '/courses/course-1'
    );
  });

  it('falls back to the course id when slug is an empty string', () => {
    expect(getCourseUrl({ id: 'course-1', slug: '' })).toBe(
      '/courses/course-1'
    );
  });

  it('encodes umlauts and spaces in slugs', () => {
    expect(
      getCourseUrl({ id: 'course-1', slug: 'ärztliche fortbildung' })
    ).toBe('/courses/%C3%A4rztliche%20fortbildung');
  });

  it('encodes slashes in slugs', () => {
    expect(getCourseUrl({ id: 'course-1', slug: 'test/kurs' })).toBe(
      '/courses/test%2Fkurs'
    );
  });

  it('encodes special characters in course id when slug is missing', () => {
    expect(getCourseUrl({ id: 'course 1/2' })).toBe('/courses/course%201%2F2');
  });

  it('throws when course id is empty and slug is missing', () => {
    expect(() => getCourseUrl({ id: '' })).toThrow(
      'Course id is required when slug is missing'
    );
  });
});

describe('getAdminCourseEditUrl', () => {
  it('builds centralized admin edit urls', () => {
    expect(getAdminCourseEditUrl('course-1')).toBe(
      '/admin/courses/course-1/edit'
    );
  });

  it('encodes special characters in admin edit urls', () => {
    expect(getAdminCourseEditUrl('course 1/2')).toBe(
      '/admin/courses/course%201%2F2/edit'
    );
  });
});