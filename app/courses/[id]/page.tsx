import { notFound } from 'next/navigation';
import CourseDetail from '@/components/CourseDetail';
import { getCourseById, getCourseBySlug } from '@/lib/api/courses';
import { CourseNotFoundError, CourseNotPublishedError } from '@/lib/errors';
import { SITE_CONFIG } from '@/lib/seo/constants';
import {
  generateBreadcrumbSchema as genBreadcrumb,
  generateOrganizationSchema as genOrgSchema,
  generateWebPageSchema as genWebPageSchema,
} from '@/lib/seo/schemas';
import { generateMetadata as genMetadata } from './layout';

export { genMetadata as generateMetadata };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id: identifier } = await params;

  let course;

  try {
    course = await getCourseBySlug(identifier);
  } catch (error) {
    if (error instanceof CourseNotPublishedError) {
      notFound();
    }

    if (error instanceof CourseNotFoundError) {
      try {
        course = await getCourseById(identifier);
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
  }

  if (!course) {
    notFound();
  }

  // Strukturierte Daten (JSON-LD)
  const courseSlug = course.slug || course.id;
  const url = `${SITE_CONFIG.url}/courses/${courseSlug}`;
  const startDateISO = course.date
    ? new Date(course.date).toISOString()
    : undefined;
  const endDateISO = undefined; // No endTime in Course type
  const inStock =
    (course.availableSpots ?? null) === null
      ? true
      : (course.availableSpots ?? 0) > 0;

  const offer = {
    '@type': 'Offer',
    price:
      (course.price ?? 0) > 0
        ? String(((course.price ?? 0) / 100).toFixed(2))
        : '0',
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

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CourseDetail
        course={course}
        bookNowHref={`/checkout?courseId=${encodeURIComponent(course.slug || course.id)}`}
      />
    </>
  );
}
