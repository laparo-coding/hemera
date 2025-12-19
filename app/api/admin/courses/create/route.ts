import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../../lib/monitoring/rollbar-official';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    const courses = await request.json();

    // Validate courses array
    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: 'Kurse müssen als Array übergeben werden' },
        { status: 400 }
      );
    }

    // Create courses in database
    const createdCourses = await prisma.course.createMany({
      data: courses.map(course => ({
        title: course.title,
        description: course.description,
        slug: course.slug,
        price: course.price,
        currency: course.currency || 'EUR',
        capacity: course.capacity,
        startDate: course.startDate ? new Date(course.startDate) : null,
        startTime: course.startTime ? new Date(course.startTime) : null,
        endTime: course.endTime ? new Date(course.endTime) : null,
        isPublished:
          course.isPublished !== undefined ? course.isPublished : true,
      })),
    });

    rollbar.info('Bulk courses created via API', {
      requestId,
      courseCount: createdCourses.count,
      route: '/api/admin/courses/create',
    });

    return NextResponse.json(
      {
        message: `${createdCourses.count} Kurse wurden erfolgreich erstellt`,
        courses: createdCourses,
      },
      { status: 201 }
    );
  } catch (error) {
    rollbar.error('Failed to create courses via bulk API', error as Error, {
      requestId,
      route: '/api/admin/courses/create',
      errorType: (error as Error).name,
    });

    return NextResponse.json(
      { error: 'Ein Fehler ist beim Erstellen der Kurse aufgetreten' },
      { status: 500 }
    );
  }
}
