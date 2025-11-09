import { PaymentStatus } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/courses/[id]
 * Get course details by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseRecord = await prisma.course.findFirst({
      where: {
        isPublished: true,
        OR: [{ id }, { slug: id }],
      },
      include: {
        bookings: {
          where: {
            paymentStatus: { in: [PaymentStatus.PAID, PaymentStatus.PENDING] },
          },
          select: { id: true },
        },
      },
    });

    if (!courseRecord) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const { bookings, ...course } = courseRecord as typeof courseRecord & {
      bookings: Array<{ id: string }>;
    };

    const totalBookings = bookings.length;

    const availableSpots =
      course.capacity !== null && course.capacity !== undefined
        ? Math.max(0, Number(course.capacity) - totalBookings)
        : null;

    return NextResponse.json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        slug: course.slug,
        price: course.price,
        currency: course.currency,
        capacity: course.capacity,
        date: course.date,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        availableSpots,
        totalBookings,
        userBookingStatus: null,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
