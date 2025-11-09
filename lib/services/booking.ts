import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { type Booking, type Course, PaymentStatus } from './course';

export interface BookingWithCourse extends Booking {
  course: Course;
}

export interface CreateBookingParams {
  userId: string;
  courseId: string;
  amount: number;
  currency?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

export interface BookingSearchParams {
  userId?: string;
  courseId?: string;
  paymentStatus?: PaymentStatus;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create a new booking
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<Booking> {
  const {
    userId,
    courseId,
    amount,
    currency = 'USD',
    stripeSessionId,
    stripePaymentIntentId,
  } = params;

  // Check if user already has a booking for this course
  const existingBooking = await prisma.booking.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  // Check if course exists and is published
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { bookings: true },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.isPublished) {
    throw new Error('Course is not published');
  }

  // Check capacity if set
  if ('capacity' in course && course.capacity) {
    const paidBookingsCount = course.bookings.filter(
      b => 'paymentStatus' in b && b.paymentStatus === PaymentStatus.PAID
    ).length;

    if (paidBookingsCount >= course.capacity) {
      throw new Error('Course is full');
    }
  }

  const updateData: Prisma.BookingUpdateInput = {};

  if (stripeSessionId && existingBooking?.stripeSessionId !== stripeSessionId) {
    updateData.stripeSessionId = stripeSessionId;
  }

  if (
    stripePaymentIntentId &&
    existingBooking?.stripePaymentIntentId !== stripePaymentIntentId
  ) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  if (typeof amount === 'number' && existingBooking?.amount !== amount) {
    updateData.amount = amount;
  }

  if (currency && existingBooking?.currency !== currency) {
    updateData.currency = currency;
  }

  if (existingBooking?.paymentStatus === PaymentStatus.CANCELLED) {
    updateData.paymentStatus = PaymentStatus.PENDING;
  }

  try {
    const booking = await prisma.booking.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
        amount,
        currency,
        paymentStatus: PaymentStatus.PENDING,
        ...(stripeSessionId && { stripeSessionId }),
        ...(stripePaymentIntentId && { stripePaymentIntentId }),
      },
      update: updateData,
    });

    return booking as unknown as Booking;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const existing = await prisma.booking.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existing) {
        if (Object.keys(updateData).length > 0) {
          const updated = await prisma.booking.update({
            where: { id: existing.id },
            data: updateData,
          });

          return updated as unknown as Booking;
        }

        return existing as unknown as Booking;
      }
    }

    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(
  id: string
): Promise<BookingWithCourse | null> {
  return (await prisma.booking.findUnique({
    where: { id },
    include: {
      course: true,
    },
  })) as unknown as BookingWithCourse | null;
}

/**
 * Get bookings with optional filtering
 */
export async function getBookings(
  params?: BookingSearchParams
): Promise<BookingWithCourse[]> {
  const where: Prisma.BookingWhereInput = {};

  if (params?.userId) {
    where.userId = params.userId;
  }

  if (params?.courseId) {
    where.courseId = params.courseId;
  }

  if (params?.paymentStatus) {
    where.paymentStatus = params.paymentStatus;
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  return (await prisma.booking.findMany({
    where,
    include: {
      course: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: params?.limit,
    skip: params?.offset,
  })) as unknown as BookingWithCourse[];
}

/**
 * Get user's bookings
 */
export async function getUserBookings(
  userId: string
): Promise<BookingWithCourse[]> {
  return getBookings({ userId });
}

/**
 * Get course bookings
 */
export async function getCourseBookings(
  courseId: string
): Promise<BookingWithCourse[]> {
  return getBookings({ courseId });
}

/**
 * Update booking status with additional payment information
 */
export async function updateBookingStatus(params: {
  id: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
}): Promise<Booking> {
  const { id, status, stripePaymentIntentId, stripeSessionId } = params;

  const updateData: Prisma.BookingUpdateInput = { paymentStatus: status };

  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  if (stripeSessionId) {
    updateData.stripeSessionId = stripeSessionId;
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: updateData,
  });

  return booking as unknown as Booking;
}

/**
 * Update booking payment status
 */
export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus,
  stripePaymentIntentId?: string
): Promise<Booking> {
  const updateData: Prisma.BookingUpdateInput = { paymentStatus };

  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });

  return booking as unknown as Booking;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  userId?: string
): Promise<Booking> {
  const where: Prisma.BookingWhereUniqueInput = { id: bookingId };

  if (userId) {
    where.userId = userId;
  }

  // Check if booking exists and belongs to user (if userId provided)
  const existingBooking = await prisma.booking.findUnique({
    where,
  });

  if (!existingBooking) {
    throw new Error('Booking not found or does not belong to user');
  }

  // Can only cancel pending or paid bookings
  const currentStatus = existingBooking.paymentStatus;
  if (![PaymentStatus.PENDING, PaymentStatus.PAID].includes(currentStatus)) {
    throw new Error(`Cannot cancel booking with status: ${currentStatus}`);
  }

  return updateBookingPaymentStatus(bookingId, PaymentStatus.CANCELLED);
}

/**
 * Get booking by Stripe session ID
 */
export async function getBookingByStripeSessionId(
  sessionId: string
): Promise<Booking | null> {
  return (await prisma.booking.findFirst({
    where: {
      ...(sessionId && { stripeSessionId: sessionId }),
    },
  })) as unknown as Booking | null;
}

/**
 * Get booking by Stripe payment intent ID
 */
export async function getBookingByStripePaymentIntentId(
  paymentIntentId: string
): Promise<Booking | null> {
  return (await prisma.booking.findFirst({
    where: {
      ...(paymentIntentId && { stripePaymentIntentId: paymentIntentId }),
    },
  })) as unknown as Booking | null;
}

/**
 * Get booking statistics
 */
export async function getBookingStats(params?: {
  userId?: string;
  courseId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.BookingWhereInput = {};

  if (params?.userId) {
    where.userId = params.userId;
  }

  if (params?.courseId) {
    where.courseId = params.courseId;
  }

  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  const bookings = await prisma.booking.findMany({
    where,
  });

  return {
    total: bookings.length,
    pending: bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING)
      .length,
    paid: bookings.filter(b => b.paymentStatus === PaymentStatus.PAID).length,
    failed: bookings.filter(b => b.paymentStatus === PaymentStatus.FAILED)
      .length,
    cancelled: bookings.filter(b => b.paymentStatus === PaymentStatus.CANCELLED)
      .length,
    refunded: bookings.filter(b => b.paymentStatus === PaymentStatus.REFUNDED)
      .length,
    totalRevenue: bookings
      .filter(b => b.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.amount, 0),
  };
}

/**
 * Check if user can book a course
 */
export async function canUserBookCourse(
  userId: string,
  courseId: string
): Promise<{
  canBook: boolean;
  reason?: string;
}> {
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { bookings: true },
  });

  if (!course) {
    return { canBook: false, reason: 'Course not found' };
  }

  if (!course.isPublished) {
    return { canBook: false, reason: 'Course is not published' };
  }

  // Check if user already has a booking
  const existingBooking = await prisma.booking.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingBooking) {
    return {
      canBook: false,
      reason: 'User already has a booking for this course',
    };
  }

  // Check capacity
  const capacity = (course as { capacity?: number }).capacity;
  if (capacity) {
    const paidBookingsCount = course.bookings.filter(
      b => b.paymentStatus === PaymentStatus.PAID
    ).length;

    if (paidBookingsCount >= capacity) {
      return { canBook: false, reason: 'Course is full' };
    }
  }

  return { canBook: true };
}
