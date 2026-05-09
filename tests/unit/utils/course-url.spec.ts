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

  it('builds centralized admin edit urls', () => {
    expect(getAdminCourseEditUrl('course-1')).toBe('/admin/courses/course-1/edit');
  });
});