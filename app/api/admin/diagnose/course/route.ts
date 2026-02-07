import { type NextRequest, NextResponse } from 'next/server';
import { createAdminHandler } from '@/lib/api/admin-route-handler';
import { getCorsHeaders } from '@/lib/utils/cors';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to diagnose and fix course visibility issues
 * GET /api/admin/diagnose/course?slug=grundkurs
 */
const getDiagnosis = async (request: NextRequest) => {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json(
      {
        error: 'Der Slug-Parameter ist erforderlich',
        code: 'SLUG_MISSING',
      },
      { status: 400, headers: getCorsHeaders() }
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
        message: `Kurs mit slug "${slug}" existiert nicht in der Datenbank`,
      },
      { status: 404, headers: getCorsHeaders() }
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

  return NextResponse.json(diagnosis, {
    headers: getCorsHeaders(),
  });
};

export const GET = createAdminHandler(getDiagnosis);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}
