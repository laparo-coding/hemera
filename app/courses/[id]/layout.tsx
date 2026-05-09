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
  DatabaseConnectionError,
} from '../../../lib/errors';
import { serverInstance } from '../../../lib/monitoring/rollbar-official';
import { SITE_CONFIG } from '../../../lib/seo/constants';
import {
  generateSEOMetadata,
  truncateDescription,
} from '../../../lib/seo/metadata';
import { isLikelyCourseId } from '../../../lib/utils/courseIdentifier';

// Note: Default layout component only needs to render children. Avoid over-typing props to satisfy Next's validator types.

function hasCourseLookupErrorInChain(
  error: unknown,
  matcher: (candidate: Error) => boolean
): boolean {
  const seen = new Set<Error>();
  let current = error;

  while (current instanceof Error && !seen.has(current)) {
    if (matcher(current)) {
      return true;
    }

    seen.add(current);
    current = current.cause;
  }

  return false;
}

function shouldRetryCourseLookup(error: unknown): boolean {
  if (
    hasCourseLookupErrorInChain(
      error,
      candidate => candidate instanceof CourseNotFoundError
    )
  ) {
    return true;
  }

  if (
    hasCourseLookupErrorInChain(
      error,
      candidate =>
        candidate instanceof CourseNotPublishedError ||
        candidate instanceof DatabaseConnectionError
    )
  ) {
    return false;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  // Last-resort fallback for generic wrappers that lose the typed cause.
  const matchesRegex =
    /(^|[\s:])(?:not found|no record)(?:$|[\s.])/i.test(error.message) ||
    /\b(?:not found|no record)\b/i.test(error.message);

  if (matchesRegex) {
    serverInstance.warning('Course lookup retry fell back to regex detection', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
              stack: error.cause.stack,
            }
          : error.cause,
    });
  }

  return matchesRegex;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: identifier } = await params;

  const likelyCourseId = isLikelyCourseId(identifier);

  try {
    // Fetch course data directly via DB helpers instead of self-fetching an API route
    // (relative fetch causes a server deadlock in dev because the server calls itself)
    let course: Course;

    try {
      course = likelyCourseId
        ? await getCourseById(identifier)
        : await getCourseBySlug(identifier);
    } catch (firstError) {
      if (!shouldRetryCourseLookup(firstError)) {
        throw firstError;
      }

      try {
        course = likelyCourseId
          ? await getCourseBySlug(identifier)
          : await getCourseById(identifier);
      } catch (retryError) {
        throw new Error(
          `Course lookup retry failed for ${identifier}: ${
            retryError instanceof Error
              ? retryError.message
              : String(retryError)
          }`,
          {
            cause:
              firstError instanceof Error
                ? firstError
                : new Error(String(firstError)),
          }
        );
      }
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
