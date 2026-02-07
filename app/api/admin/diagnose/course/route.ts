import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to diagnose and fix course visibility issues
 * GET /api/admin/diagnose/course?slug=grundkurs
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json(
        { error: 'slug parameter is required' },
        { status: 400 }
      );
    }

    // Find course by slug (including non-public)
    const course = await prisma.course.findFirst({
      where: { slug },
      include: {
        bookings: { select: { id: true, paymentStatus: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          status: 'not_found',
          slug,
          message: `Course with slug "${slug}" does not exist in database`,
        },
        { status: 404 }
      );
    }

    // Diagnose visibility
    const diagnosis = {
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      isPublished: course.isPublished,
      isNonPublic: course.isNonPublic,
      price: course.price,
      bookingCount: course.bookings.length,
      visibilityStatus:
        course.isNonPublic && !course.isPublished
          ? 'HIDDEN (non-public & unpublished)'
          : course.isNonPublic && course.isPublished
            ? 'WARNING (non-public but published)'
            : course.isPublished
              ? 'VISIBLE (public & published)'
              : 'HIDDEN (unpublished)',
      canCheckout: !course.isNonPublic || course.isPublished, // After fix in create-intent
    };

    return NextResponse.json(diagnosis);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
