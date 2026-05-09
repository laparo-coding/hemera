export interface E2ELocationBase {
  slug: string;
  name: string;
  address: string;
  zipCode: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  latitude: number;
  longitude: number;
}

export interface E2ELocation extends E2ELocationBase {
  description: string;
}

export interface RawE2ECourseFixture {
  title: string;
  description: string;
  teaser: string;
  slug: string;
  price: number;
  currency: string;
  capacity: number;
  startDate: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  instructor: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface E2ECourseFixture
  extends Omit<RawE2ECourseFixture, 'startDate' | 'startTime' | 'endTime'> {
  startDate: Date;
  startTime: Date;
  endTime: Date;
  locationId: string;
}

export const CENTS_PER_EURO = 100;

export const E2E_TEST_LOCATION: E2ELocationBase = {
  slug: 'gartenhotel-fette-henne',
  name: 'Gartenhotel Fette Henne',
  address: 'Schildsheider Str. 47',
  zipCode: '40699',
  city: 'Erkrath',
  email: 'gartenhotel@fettehennehotels.de',
  phone: '+49 2104 13830',
  website: 'https://www.gartenhotel-fettehenne.de/',
  latitude: 51.2052406,
  longitude: 6.9653751,
};

export const E2E_TEST_COURSE_FIXTURES: RawE2ECourseFixture[] = [
  {
    title: 'Gehe zielsicher durch dein Gehaltsgespräch',
    description: 'Produktionsnahe Testdaten fuer den Grundkurs.',
    teaser: 'Produktionsnahe Testdaten fuer den Grundkurs.',
    slug: 'grundkurs',
    price: 30000,
    currency: 'EUR',
    capacity: 6,
    startDate: '2026-06-19T00:00:00Z',
    startTime: '2026-06-19T08:00:00Z',
    endTime: '2026-06-19T18:15:00Z',
    isPublished: true,
    instructor: 'Andreas',
    level: 'BEGINNER',
  },
  {
    title: 'Fortgeschrittene Verhandlungsstrategien',
    description: 'Produktionsnahe Testdaten fuer den Aufbaukurs.',
    teaser: 'Produktionsnahe Testdaten fuer den Aufbaukurs.',
    slug: 'fortgeschrittene',
    price: 50000,
    currency: 'EUR',
    capacity: 12,
    startDate: '2026-09-18T00:00:00Z',
    startTime: '2026-09-18T08:00:00Z',
    endTime: '2026-09-18T16:00:00Z',
    isPublished: true,
    instructor: 'Andreas',
    level: 'INTERMEDIATE',
  },
  {
    title: 'Masterclass: Exzellenz in Verhandlungen',
    description: 'Produktionsnahe Testdaten fuer die Masterclass.',
    teaser: 'Produktionsnahe Testdaten fuer die Masterclass.',
    slug: 'masterclass',
    price: 70000,
    currency: 'EUR',
    capacity: 7,
    startDate: '2027-01-22T00:00:00Z',
    startTime: '2027-01-22T08:00:00Z',
    endTime: '2027-01-22T17:00:00Z',
    isPublished: true,
    instructor: 'Andreas',
    level: 'ADVANCED',
  },
];

export const E2E_CHECKOUT_COURSE = {
  slug: E2E_TEST_COURSE_FIXTURES[0]!.slug,
  title: E2E_TEST_COURSE_FIXTURES[0]!.title,
  price: E2E_TEST_COURSE_FIXTURES[0]!.price / CENTS_PER_EURO,
} as const;

export function createE2ELocationData(description: string): E2ELocation {
  return {
    ...E2E_TEST_LOCATION,
    description,
  };
}

export function createE2ECourseData(locationId: string): E2ECourseFixture[] {
  return E2E_TEST_COURSE_FIXTURES.map(course => ({
    ...course,
    startDate: new Date(course.startDate),
    startTime: new Date(course.startTime),
    endTime: new Date(course.endTime),
    locationId,
  }));
}
