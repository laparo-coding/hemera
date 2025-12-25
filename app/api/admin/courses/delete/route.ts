import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../../lib/monitoring/rollbar-official';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

export async function DELETE(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('id');

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    // Check admin role
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    // Validate course ID
    if (!courseId) {
      return NextResponse.json(
        { error: 'Kurs-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      rollbar.warning('Attempt to delete non-existent course', {
        requestId,
        courseId,
        route: '/api/admin/courses/delete',
      });

      return NextResponse.json(
        { error: 'Kurs nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete course
    await prisma.course.delete({
      where: { id: courseId },
    });

    rollbar.info('Course deleted via legacy API', {
      requestId,
      courseId,
      courseTitle: existingCourse.title,
      route: '/api/admin/courses/delete',
    });

    return NextResponse.json(
      { message: `Kurs "${existingCourse.title}" wurde erfolgreich gelöscht` },
      { status: 200 }
    );
  } catch (error) {
    rollbar.error('Failed to delete course via legacy API', error as Error, {
      requestId,
      courseId,
      route: '/api/admin/courses/delete',
      errorType: (error as Error).name,
    });

    return NextResponse.json(
      { error: 'Ein Fehler ist beim Löschen des Kurses aufgetreten' },
      { status: 500 }
    );
  }
}
