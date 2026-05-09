import type { Metadata } from 'next';
import type { CourseCardProps } from '../components/landing';
import {
  ConceptSection,
  CourseProgressionSection,
  HeroSection,
} from '../components/landing';
import { getFeaturedCourses } from '../lib/api/courses';
import { serverInstance } from '../lib/monitoring/rollbar-official';
import { generateLandingPageMetadata } from '../lib/seo/metadata';
import { SCHEMA_COMBINATIONS } from '../lib/seo/schemas';
import { getLevelLabel } from '../lib/utils/course-level';
import { formatDate, formatTime } from '../lib/utils/date-format';

/**
 * Premium Feminine Landing Page for Hemera Academy
 *
 * One-Page Concept: All relevant information on the homepage
 * - Hemera concept and philosophy
 * - Three courses with their respective dates
 * - Clear course progression (Beginner → Advanced → Masterclass)
 *
 * Design: Premium, harmonious, interior architecture style
 * Target: Women in senior professional positions
 */

export const metadata: Metadata = generateLandingPageMetadata();

// Revalidate periodically so the homepage stays cacheable in production while
// still picking up updated featured courses.
export const revalidate = 300;

// Content in German, informal "Du" form
const heroContent = {
  headline: 'Überzeuge mit deinen vielschichtigen Kräften',
  subheadline:
    'Erreiche dein Verhandlungsziel auf kooperative Art. Die Hemera Akademie begleitet dich auf deinem Weg zu erfolgreichen Gehaltsverhandlungen.',
  ctaPrimaryText: 'Entdecke die Kurse',
  ctaPrimaryHref: '#kurse',
  ctaSecondaryText: 'Mehr erfahren',
  ctaSecondaryHref: '#konzept',
};

const conceptContent = {
  id: 'konzept',
  headline: 'Das Hemera-Konzept',
  paragraphs: [
    'Du verdienst mehr – und weißt es auch. Bei Hemera lernst du, wie du deine Gehaltsverhandlung selbstbewusst und erfolgreich führst.',
    'Unsere Methode verbindet strategisches Wissen mit praktischen Übungen. Du entwickelst nicht nur Verhandlungskompetenzen, sondern auch das Selbstvertrauen, diese einzusetzen.',
  ],
  features: [
    {
      title: 'Praxisorientiert',
      description:
        'Du übst in realistischen Szenarien und erhältst direktes Feedback.',
    },
    {
      title: 'Wissenschaftlich fundiert',
      description:
        'Unsere Methoden basieren auf aktueller Verhandlungsforschung.',
    },
    {
      title: 'Persönlich begleitet',
      description: 'Kleine Gruppen ermöglichen individuelle Betreuung.',
    },
  ],
};

// Map database level to UI level indicator
function mapLevelToIndicator(
  level: string | null | undefined,
  index: number
): 'A' | 'B' | 'C' {
  if (level === 'BEGINNER') return 'A';
  if (level === 'INTERMEDIATE') return 'B';
  if (level === 'ADVANCED') return 'C';
  // Fallback based on position
  return (['A', 'B', 'C'] as const)[index] || 'A';
}

export default async function HomePage() {
  // Fetch courses from database
  let featuredCourses: CourseCardProps[] = [];

  try {
    const dbCourses = await getFeaturedCourses(3);
    if (dbCourses.length > 0) {
      // Transform database courses to CourseCardProps
      featuredCourses = dbCourses.map((course, index) => {
        const formattedDate = formatDate(course.startDate);
        const upcomingDates =
          course.startDate && formattedDate
            ? [
                {
                  date: new Date(course.startDate),
                  formattedDate,
                  startTime: formatTime(course.startTime),
                  endTime: formatTime(course.endTime),
                },
              ]
            : [];

        return {
          courseId: course.slug,
          level: mapLevelToIndicator(course.level, index),
          levelLabel: getLevelLabel(course.level),
          title: course.title,
          description: course.teaser || '',
          upcomingDates,
          detailHref: `/courses/${course.slug}`,
          ctaText: 'Mehr erfahren',
          location: course.location
            ? {
                name: course.location.name,
                slug: course.location.slug,
                city: course.location.city,
              }
            : undefined,
          thumbnailUrl: course.thumbnailUrl,
        } satisfies CourseCardProps;
      });
    }
  } catch (error) {
    // Log error but don't crash - show empty course section
    serverInstance.error(
      error instanceof Error ? error : new Error(String(error))
    );
  }

  // JSON-LD Structured Data for SEO
  const jsonLdSchemas = SCHEMA_COMBINATIONS.homepage();

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}

      <main>
        {/* Hero Section */}
        <HeroSection {...heroContent} />

        {/* Concept Section */}
        <ConceptSection {...conceptContent} />

        {/* Course Progression Section */}
        <CourseProgressionSection
          id='kurse'
          headline='Dein Weg zum Verhandlungserfolg'
          subheadline='Drei aufeinander aufbauende Kurse begleiten dich von den Grundlagen bis zur Meisterschaft.'
          courses={featuredCourses}
          showProgression={false}
        />
      </main>
    </>
  );
}
