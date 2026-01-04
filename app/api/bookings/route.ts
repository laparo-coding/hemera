import { currentUser } from '@clerk/nextjs/server';
import { PaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/db/prisma';

const BookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
});

const CreateBookingSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

export async function GET(request: Request) {
  const _requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = BookingQuerySchema.parse(queryParams);

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure the user exists in our database (upsert from Clerk)
    const { syncUserFromClerk } = await import('../../../lib/api/users');
    await syncUserFromClerk(user);

    // Get user's bookings with pagination
    const where = {
      userId: user.id,
      ...(validatedParams.status && { paymentStatus: validatedParams.status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          course: {
            select: {
              title: true,
              price: true,
              currency: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (validatedParams.page - 1) * validatedParams.limit,
        take: validatedParams.limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / validatedParams.limit);

    const normalizedBookings = bookings.map(booking => {
      if (!booking.course) {
        console.warn(
          '[API /api/bookings GET] Missing course relation for booking',
          booking.id
        );
      }

      return {
        id: booking.id,
        courseId: booking.courseId,
        courseTitle: booking.course?.title ?? 'Kurs nicht mehr verfügbar',
        coursePrice: booking.course?.price ?? booking.amount,
        currency: booking.course?.currency ?? booking.currency ?? 'EUR',
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      };
    });

    const responseData = {
      success: true,
      data: {
        bookings: normalizedBookings,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          pages: totalPages,
        },
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API /api/bookings GET] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateBookingSchema.parse(body);

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: {
        id: validatedData.courseId,
        isPublished: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or not available' },
        { status: 404 }
      );
    }

    // Ensure the user exists in our database (upsert from Clerk)
    const { syncUserFromClerk } = await import('../../../lib/api/users');
    await syncUserFromClerk(user);

    // Check if user already has a booking for this course
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        courseId: validatedData.courseId,
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'You have already booked this course' },
        { status: 409 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        courseId: validatedData.courseId,
        paymentStatus: PaymentStatus.PENDING,
        amount: course.price,
        currency: course.currency,
      },
      include: {
        course: {
          select: {
            title: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          courseId: booking.courseId,
          courseTitle: booking.course.title,
          price: booking.course.price,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
