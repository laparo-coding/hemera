export const TEST_COURSE_ID = 'cm1234567890abcdefghij123';

export interface UnitTestCourse {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  readonly startDate: Date;
}

export interface ServiceApiCourse extends UnitTestCourse {
  endDate: Date;
  _count: {
    bookings: number;
  };
}

export const UNIT_TEST_COURSE: UnitTestCourse = {
  id: TEST_COURSE_ID,
  title: 'Gehe zielsicher durch dein Gehaltsgespräch',
  slug: 'grundkurs',
  level: 'BEGINNER',
  startDate: new Date('2026-01-15'),
};

export function createServiceApiCourse(
  overrides: Partial<ServiceApiCourse> = {}
): ServiceApiCourse {
  return {
    ...UNIT_TEST_COURSE,
    endDate: new Date('2026-03-03'),
    _count: { bookings: 2 },
    ...overrides,
  };
}