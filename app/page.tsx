import type { Metadata } from 'next';
import type { CourseCardProps } from '../components/landing';
import {
  ConceptSection,
  CourseProgressionSection,
  HeroSection,
} from '../components/landing';
import { getFeaturedCourses } from '../lib/api/courses';
import { generateLandingPageMetadata } from '../lib/seo/metadata';
import { SCHEMA_COMBINATIONS } from '../lib/seo/schemas';
import { getLevelLabel } from '../lib/utils/course-level';

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

// Force dynamic rendering since we fetch courses from DB
// This prevents static generation during build when DATABASE_URL is unavailable
export const dynamic = 'force-dynamic';

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

// Format time from Date object
function formatTime(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Static fallback course data
const staticCourses: CourseCardProps[] = [
  {
    courseId: 'grundkurs',
    level: 'A',
    levelLabel: 'Basis',
    title: 'Grundlagen der Gehaltsverhandlung',
    description:
      'Lerne die fundamentalen Strategien und Techniken für erfolgreiche Gehaltsverhandlungen. Perfekt für den Einstieg.',
    upcomingDates: [
      { date: new Date('2025-01-15'), formattedDate: '15. Januar 2025' },
    ],
    detailHref: '/courses/grundkurs',
    ctaText: 'Mehr erfahren',
  },
  {
    courseId: 'fortgeschrittene',
    level: 'B',
    levelLabel: 'Fortgeschrittene',
    title: 'Fortgeschrittene Verhandlungsstrategien',
    description:
      'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen zu meistern.',
    upcomingDates: [
      { date: new Date('2025-02-20'), formattedDate: '20. Februar 2025' },
    ],
    detailHref: '/courses/fortgeschrittene',
    ctaText: 'Mehr erfahren',
  },
  {
    courseId: 'masterclass',
    level: 'C',
    levelLabel: 'Masterclass',
    title: 'Masterclass: Exzellenz in Verhandlungen',
    description:
      'Das Expertenprogramm für komplexe Verhandlungssituationen. Für alle, die ihre Fähigkeiten perfektionieren wollen.',
    upcomingDates: [
      { date: new Date('2025-03-28'), formattedDate: '28. März 2025' },
    ],
    detailHref: '/courses/masterclass',
    ctaText: 'Mehr erfahren',
  },
];

export default async function HomePage() {
  // Fetch real courses from API (fallback to static data on error)
  let featuredCourses: CourseCardProps[] = staticCourses;

  try {
    const dbCourses = await getFeaturedCourses(3);
    if (dbCourses.length > 0) {
      // Transform database courses to CourseCardProps
      featuredCourses = dbCourses.map((course, index) => ({
        courseId: course.slug,
        level: mapLevelToIndicator(course.level, index),
        levelLabel: getLevelLabel(course.level),
        title: course.title,
        description: course.description || '',
        upcomingDates: course.startDate
          ? [
              {
                date: new Date(course.startDate),
                formattedDate: new Date(course.startDate).toLocaleDateString(
                  'de-DE',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                ),
                startTime: formatTime(course.startTime),
                endTime: formatTime(course.endTime),
              },
            ]
          : [],
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
      }));
    }
  } catch (error) {
    // Log error but don't crash - use static courses as fallback
    console.error('Failed to fetch featured courses:', error);
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
