import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  type Course,
  getCourseById,
  getCourseBySlug,
} from '../../../lib/api/courses';
import {
  CourseNotFoundError,
  CourseNotPublishedError,
} from '../../../lib/errors';
import { SITE_CONFIG } from '../../../lib/seo/constants';
import {
  generateSEOMetadata,
  truncateDescription,
} from '../../../lib/seo/metadata';

// Note: Default layout component only needs to render children. Avoid over-typing props to satisfy Next's validator types.

function shouldRetryCourseLookup(error: unknown): boolean {
  if (error instanceof CourseNotFoundError) {
    return true;
  }

  if (error instanceof CourseNotPublishedError) {
    return false;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /not found|no record/i.test(error.message);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: identifier } = await params;

  const isLikelyCourseId = /^c[a-z0-9]{20,}$/i.test(identifier);

  try {
    // Fetch course data directly via DB helpers instead of self-fetching an API route
    // (relative fetch causes a server deadlock in dev because the server calls itself)
    let course: Course;

    try {
      course = isLikelyCourseId
        ? await getCourseById(identifier)
        : await getCourseBySlug(identifier);
    } catch (error) {
      if (!shouldRetryCourseLookup(error)) {
        throw error;
      }

      course = isLikelyCourseId
        ? await getCourseBySlug(identifier)
        : await getCourseById(identifier);
    }

    const title = course.title ?? 'Kurs';
    const canonicalSlug = course.slug ?? identifier;
    const description = truncateDescription(
      course.description ??
        'Seminardetails der Hemera Academy: Inhalte, Termine und Buchungsinformationen.',
      160
    );
    // Use Twitter image from database if available, otherwise fallback
    const ogImage = course.imageTwitter
      ? course.imageTwitter
      : course.slug
        ? `/images/courses/${course.slug}.jpg`
        : undefined;

    return generateSEOMetadata({
      title,
      description,
      canonicalUrl: `${SITE_CONFIG.url}/courses/${canonicalSlug}`,
      ogImage,
    });
  } catch (_) {
    // Course not found or DB error – provide minimal but valid metadata
    return generateSEOMetadata({
      title: 'Seminar',
      description: 'Seminardetails und Informationen.',
      canonicalUrl: `${SITE_CONFIG.url}/courses/${identifier}`,
    });
  }
}

export default function CourseDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
