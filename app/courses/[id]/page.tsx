import { notFound } from 'next/navigation';
import type { CourseDetailCourse } from '../../../components/course-detail';
import { CourseDetailLayout } from '../../../components/course-detail';
import type { CurriculumModule } from '../../../components/course-detail/CurriculumSection';
import { getCourseById, getCourseBySlug } from '../../../lib/api/courses';
import {
  CourseNotFoundError,
  CourseNotPublishedError,
} from '../../../lib/errors';
import { SITE_CONFIG } from '../../../lib/seo/constants';
import {
  generateBreadcrumbSchema as genBreadcrumb,
  generateOrganizationSchema as genOrgSchema,
  generateWebPageSchema as genWebPageSchema,
} from '../../../lib/seo/schemas';
import { isLikelyCourseId } from '../../../lib/utils/courseIdentifier';
import { generateMetadata as genMetadata } from './layout';

export { genMetadata as generateMetadata };

// Revalidate every 60 seconds for fresh data while enabling caching
export const revalidate = 60;

/**
 * Runtime guard to ensure curriculum is a valid array of modules.
 * Protects against legacy data that may contain non-array values.
 */
function ensureCurriculumArray(curriculum: unknown): CurriculumModule[] {
  if (!Array.isArray(curriculum)) {
    return [];
  }
  // Filter out any malformed modules (must have id, day, title, topics)
  return curriculum.filter(
    (mod): mod is CurriculumModule =>
      typeof mod === 'object' &&
      mod !== null &&
      typeof mod.id === 'string' &&
      typeof mod.day === 'number' &&
      typeof mod.title === 'string' &&
      Array.isArray(mod.topics)
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Map API level string to typed level
 */
function mapLevel(
  level: string | null | undefined
): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  const normalizedLevel = level?.toUpperCase();
  if (
    normalizedLevel === 'BEGINNER' ||
    normalizedLevel === 'INTERMEDIATE' ||
    normalizedLevel === 'ADVANCED'
  ) {
    return normalizedLevel;
  }
  return 'BEGINNER'; // Default
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id: identifier } = await params;

  let course: Awaited<ReturnType<typeof getCourseBySlug>> | null = null;

  try {
    if (isLikelyCourseId(identifier)) {
      course = await getCourseById(identifier);
    } else {
      course = await getCourseBySlug(identifier);
    }
  } catch (error) {
    if (error instanceof CourseNotPublishedError) {
      notFound();
    }

    if (error instanceof CourseNotFoundError) {
      try {
        if (isLikelyCourseId(identifier)) {
          course = await getCourseBySlug(identifier);
        } else {
          course = await getCourseById(identifier);
        }
      } catch (innerError) {
        if (
          innerError instanceof CourseNotFoundError ||
          innerError instanceof CourseNotPublishedError
        ) {
          notFound();
        }

        throw innerError;
      }
    } else {
      throw error;
    }

    try {
      if (isLikelyCourseId(identifier)) {
        course = await getCourseBySlug(identifier);
      } else {
        course = await getCourseById(identifier);
      }
    } catch (innerError) {
      if (
        innerError instanceof CourseNotFoundError ||
        innerError instanceof CourseNotPublishedError
      ) {
        notFound();
      }

      throw innerError;
    }
  }

  if (!course) {
    notFound();
  }

  // Strukturierte Daten (JSON-LD)
  const courseSlug = course.slug || course.id;
  const url = `${SITE_CONFIG.url}/courses/${courseSlug}`;
  const startDateISO = course.startDate
    ? new Date(course.startDate).toISOString()
    : undefined;
  const endDateISO = course.endTime
    ? new Date(course.endTime).toISOString()
    : undefined;
  const inStock =
    (course.availableSpots ?? null) === null
      ? true
      : (course.availableSpots ?? 0) > 0;

  const offer = {
    '@type': 'Offer',
    price: (course.price ?? 0) > 0 ? String(course.price ?? 0) : '0',
    priceCurrency: 'EUR',
    availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`,
    url,
    ...(course.availableSpots !== null && course.availableSpots !== undefined
      ? {
          inventoryLevel: {
            '@type': 'QuantitativeValue',
            value: course.availableSpots,
          },
        }
      : {}),
  } as const;

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description:
      course.description ||
      'Kursdetails der Hemera Academy: Inhalte, Termine und Buchungsinformationen.',
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Hemera Academy',
      url: SITE_CONFIG.url,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(startDateISO ? { startDate: startDateISO } : {}),
      ...(endDateISO ? { endDate: endDateISO } : {}),
      location: {
        '@type': 'VirtualLocation',
        url,
      },
    },
    offers: offer,
    url,
    inLanguage: 'de-DE',
  } as const;

  const schemas = [
    genOrgSchema(),
    genWebPageSchema({
      title: course.title,
      description:
        course.description ||
        'Kursdetails der Hemera Academy: Inhalte, Termine und Buchungsinformationen.',
      url,
      type: 'Course',
    }),
    genBreadcrumb([
      { name: 'Start', url: SITE_CONFIG.url },
      { name: 'Kurse', url: `${SITE_CONFIG.url}/courses` },
      { name: course.title, url },
    ]),
    courseSchema,
  ];

  // Map course data to CourseDetailLayout format
  const courseForLayout: CourseDetailCourse = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    level: mapLevel(course.level),
    // heroVideoPlaybackId not yet in DB - will be added after migration
    heroVideoPlaybackId:
      (course as { heroVideoPlaybackId?: string | null }).heroVideoPlaybackId ??
      null,
    thumbnailUrl: course.thumbnailUrl ?? null,
    instructor: course.instructor ?? null,
    price: course.price,
    currency: course.currency || 'EUR',
    startDate: course.startDate ?? null,
    startTime: course.startTime ?? null,
    endTime: course.endTime ?? null,
    location: course.location
      ? { name: course.location.name, city: course.location.city }
      : null,
    // These will come from extended course data in future
    learningObjectives: [],
    // Curriculum from database with runtime guard for legacy data
    curriculumModules: ensureCurriculumArray(course.curriculum),
    testimonials: [],
  };

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CourseDetailLayout course={courseForLayout} />
    </>
  );
}
