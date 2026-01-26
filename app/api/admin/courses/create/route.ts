import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { checkUserAdminStatus } from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../../lib/monitoring/rollbar-official';
import { curriculumSchema } from '../../../../../lib/schemas/admin/course';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin permission required' },
        { status: 403 }
      );
    }

    const courses = await request.json();

    // Validate courses array
    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: 'Courses must be provided as an array' },
        { status: 400 }
      );
    }

    // Validate curriculum for each course if provided
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      if (course?.curriculum !== undefined) {
        try {
          curriculumSchema.parse(course.curriculum);
        } catch (zodError) {
          if (zodError instanceof ZodError) {
            rollbar.warning('Invalid curriculum data in bulk create request', {
              requestId,
              courseIndex: i,
              issues: zodError.issues,
            });
            return NextResponse.json(
              {
                error: `Invalid curriculum structure for course at index ${i}`,
                details: zodError.issues,
              },
              { status: 400 }
            );
          }
          throw zodError;
        }
      }
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
        curriculum: course.curriculum ?? null,
      })),
    });

    rollbar.info('Bulk courses created via API', {
      requestId,
      courseCount: createdCourses.count,
      route: '/api/admin/courses/create',
    });

    return NextResponse.json(
      {
        message: `${createdCourses.count} courses successfully created`,
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
      { error: 'An error occurred while creating courses' },
      { status: 500 }
    );
  }
}
