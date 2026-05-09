import type { User as ClerkUser } from '@clerk/nextjs/server';
import { type ParticipationStatus, PaymentStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';
import { logError } from '@/lib/errors';
import { ErrorSeverity, reportError } from '@/lib/monitoring/rollbar-official';
import type { PaymentStatus as ApiPaymentStatus } from '@/lib/types/booking';
import type { ParticipationStatus as ApiParticipationStatus } from '@/lib/types/participation';
import { isClerkDisabled } from '@/lib/utils/clerk-disabled-check';
import { getOrCreateRequestIdFromHeaders } from '@/lib/utils/request-id';

const BookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
});

const CreateBookingSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

/**
 * Sanitize data for error reporting to prevent large payloads
 * - Ensures primitives are serialized correctly
 * - Caps string lengths to avoid backend drops
 */
function sanitizeForErrorReporting(
  data: Record<string, unknown>
): Record<string, unknown> {
  const MAX_STRING_LENGTH = 200;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] =
        value.length > MAX_STRING_LENGTH
          ? `${value.substring(0, MAX_STRING_LENGTH)}...[truncated]`
          : value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else {
      // Convert objects/arrays to string representation (capped)
      const stringified = String(value);
      sanitized[key] =
        stringified.length > MAX_STRING_LENGTH
          ? `${stringified.substring(0, MAX_STRING_LENGTH)}...[truncated]`
          : stringified;
    }
  }

  return sanitized;
}

type BookingRecord = {
  id: string;
  courseId: string;
  paymentStatus: PaymentStatus;
  amount: number | null;
  currency: string | null;
  createdAt: Date;
  stripeInvoiceId: string | null;
  stripeInvoicePdfUrl: string | null;
  course?: {
    id: string;
    title: string | null;
    startDate: Date | null;
    endDate: Date | null;
    startTime: Date | null;
    endTime: Date | null;
    location?: {
      id: string;
      name: string;
      slug: string;
      city: string | null;
    } | null;
  } | null;
  participation?: {
    id: string;
    status: ParticipationStatus;
  } | null;
};

type NormalizedBookingRecord = {
  id: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  currency: string;
  paymentStatus: ApiPaymentStatus;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationCity: string | null;
  hasParticipation: boolean;
  participationStatus: ApiParticipationStatus | null;
  stripeInvoicePdfUrl: string | null;
};

function normalizeBookings(
  bookings: BookingRecord[],
  requestId: string
): NormalizedBookingRecord[] {
  return bookings.map(booking => {
    if (!booking.course) {
      reportError(
        '[API /api/bookings GET] Missing course relation for booking',
        {
          requestId,
          additionalData: sanitizeForErrorReporting({
            bookingId: String(booking.id), // Ensure primitive string
            courseId: String(booking.courseId),
          }),
        },
        ErrorSeverity.WARNING
      );
    }

    return {
      id: booking.id,
      courseId: booking.courseId,
      courseTitle: booking.course?.title ?? 'Kurs nicht mehr verfügbar',
      coursePrice: booking.amount ?? 0,
      currency: booking.currency ?? 'EUR',
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt.toISOString(),
      // New fields for dashboard
      startDate: booking.course?.startDate?.toISOString() ?? null,
      endDate: booking.course?.endDate?.toISOString() ?? null,
      startTime: booking.course?.startTime?.toISOString() ?? null,
      endTime: booking.course?.endTime?.toISOString() ?? null,
      locationName: booking.course?.location?.name ?? null,
      locationSlug: booking.course?.location?.slug ?? null,
      locationCity: booking.course?.location?.city ?? null,
      hasParticipation: booking.participation?.id != null,
      participationStatus: booking.participation?.status ?? null,
      stripeInvoicePdfUrl: booking.stripeInvoicePdfUrl,
    };
  });
}

async function resolveSyncedUserId(
  user: ClerkUser,
  requestId: string
): Promise<string> {
  const { syncUserFromClerk } = await import('../../../lib/api/users');

  try {
    const syncedUser = await syncUserFromClerk(user);
    return syncedUser.id;
  } catch (syncError) {
    const email = user.primaryEmailAddress?.emailAddress ?? null;
    const fallbackUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: user.id }, ...(email ? [{ email }] : [])],
      },
      select: {
        id: true,
      },
    });

    if (fallbackUser) {
      reportError(
        new Error('Recovered bookings user resolution after sync failure'),
        {
          requestId,
          additionalData: sanitizeForErrorReporting({
            clerkUserId: user.id,
            email,
            syncError:
              syncError instanceof Error
                ? syncError.message
                : String(syncError),
          }),
        },
        ErrorSeverity.WARNING
      );

      return fallbackUser.id;
    }

    throw syncError;
  }
}

export async function GET(request: Request) {
  const _requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = BookingQuerySchema.parse(queryParams);

    const user = await getCurrentUser();
    if (!user?.id) {
      // E2E test fallback: when Clerk is disabled, return 401 early
      if (isClerkDisabled()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentifizierung im E2E-Modus deaktiviert',
            mockMode: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    // Ensure the user exists in our database (upsert from Clerk)
    const syncedUserId = await resolveSyncedUserId(user, _requestId);

    // Get user's bookings with pagination (use synced DB user ID, not Clerk ID)
    const where = {
      userId: syncedUserId,
      ...(validatedParams.status && { paymentStatus: validatedParams.status }),
    };

    const [bookingRecords, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
              location: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  city: true,
                },
              },
            },
          },
          participation: {
            select: {
              id: true,
              status: true,
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

    const bookingsResult = bookingRecords as BookingRecord[];
    const total = totalCount;

    const totalPages = Math.ceil(total / validatedParams.limit);
    const normalizedBookings = normalizeBookings(bookingsResult, _requestId);

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
    logError(error, {
      operation: 'api/bookings#get',
      requestId: _requestId,
    });
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
  const requestId = getOrCreateRequestIdFromHeaders(request.headers);

  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      // E2E test fallback: when Clerk is disabled, return 401 early
      if (isClerkDisabled()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentifizierung im E2E-Modus deaktiviert',
            mockMode: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Authentifizierung erforderlich' },
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
    const syncedUserId = await resolveSyncedUserId(user, requestId);

    // Check if user already has a booking for this course
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: syncedUserId,
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
        userId: syncedUserId,
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
    logError(error, {
      operation: 'api/bookings#post',
      requestId,
    });

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
