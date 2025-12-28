import { type NextRequest, NextResponse } from 'next/server';
import { getNextUpcomingCourse } from '../../../../lib/api/courses';
import { serverInstance } from '../../../../lib/monitoring/rollbar-official';

/**
 * GET /api/courses/next
 * Returns the next upcoming course
 */
export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).slice(2);

  try {
    const course = await getNextUpcomingCourse();
    const duration = Date.now() - startTime;
    serverInstance.info('GET /api/courses/next completed', {
      requestId,
      durationMs: duration,
      found: Boolean(course),
      timestamp: new Date().toISOString(),
    });

    if (!course) {
      // Return a mock course for testing
      const mockCourse = {
        id: 'mock-course-1',
        title: 'Grundlagen der Gehaltsverhandlung',
        date: '2026-01-15T10:00:00.000Z',
        slug: 'grundkurs',
      };
      return NextResponse.json(mockCourse);
    }

    // Format the response to match the expected interface
    const formattedCourse = {
      id: course.id,
      title: course.title,
      startDate: course.startDate?.toISOString() || null,
      startTime: course.startTime?.toISOString() || null,
      endTime: course.endTime?.toISOString() || null,
      slug: course.slug,
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    serverInstance.error('Error fetching next course', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to fetch next course' },
      { status: 500 }
    );
  }
}
