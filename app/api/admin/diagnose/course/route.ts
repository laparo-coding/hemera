import type { NextRequest } from 'next/server';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to diagnose and fix course visibility issues
 * GET /api/admin/diagnose/course?slug=grundkurs
 */
const getDiagnosis = async (
  requestId: string,
  request?: NextRequest
): Promise<unknown> => {
  const slug = request?.nextUrl.searchParams.get('slug');
  if (!slug) {
    throw new Error('Der Slug-Parameter ist erforderlich');
  }

  // Find course by slug (including non-public)
  const course = await prisma.course.findFirst({
    where: { slug },
    include: {
      bookings: { select: { id: true, paymentStatus: true } },
    },
  });

  if (!course) {
    throw new Error(`Kurs mit slug "${slug}" existiert nicht in der Datenbank`);
  }

  // Diagnose visibility
  return {
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
    requestId,
  };
};

export const GET = createAdminHandler(getDiagnosis, {
  context: 'AdminDiagnose.Course.GET',
  errorMessage: 'Fehler beim Abrufen der Kurs-Diagnose',
});

export const OPTIONS = adminOptions;
