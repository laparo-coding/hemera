import {
  type Booking,
  type Course,
  PaymentStatus,
  type User,
} from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  BookingAlreadyExistsError,
  BookingNotFoundError,
  CourseNotFoundError,
  CourseNotPublishedError,
  DatabaseConnectionError,
  InvalidBookingStatusError,
  logError,
  UserNotFoundError,
} from '../errors';

/**
 * Booking model with API utilities
 *
 * Provides type-safe access to booking data with:
 * - CRUD operations for bookings
 * - User-specific booking queries
 * - Validation and error handling
 * - Payment status management
 */

export type { Booking } from '@prisma/client';

export interface BookingWithDetails extends Booking {
  course: Course;
  user: User;
}

export interface CreateBookingData {
  userId: string;
  courseId: string;
  paymentStatus?: PaymentStatus;
}

export interface BookingListResponse {
  bookings: BookingWithDetails[];
  total: number;
}

/**
 * Create a new booking for a user and course
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new UserNotFoundError(data.userId);
    }

    // Check if course exists and is published
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        isPublished: true,
        isNonPublic: false, // Exclude Learning Path invite-only courses
      },
    });

    if (!course) {
      throw new CourseNotFoundError(data.courseId);
    }

    if (!course.isPublished) {
      throw new CourseNotPublishedError(data.courseId);
    }

    // Check if booking already exists
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_courseId: {
          userId: data.userId,
          courseId: data.courseId,
        },
      },
    });

    if (existingBooking) {
      throw new BookingAlreadyExistsError(data.userId, data.courseId);
    }

    return await prisma.booking.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
        amount: course.price || 0,
      },
    });
  } catch (error) {
    if (
      error instanceof UserNotFoundError ||
      error instanceof CourseNotFoundError ||
      error instanceof CourseNotPublishedError ||
      error instanceof BookingAlreadyExistsError
    ) {
      throw error; // Re-throw our custom errors
    }

    logError(error, { operation: 'createBooking', data });
    throw new DatabaseConnectionError('creating booking', error as Error);
  }
}

/**
 * Get all bookings for a specific user
 */
export async function getUserBookings(
  userId: string
): Promise<BookingWithDetails[]> {
  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return await prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        course: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }

    logError(error, { operation: 'getUserBookings', userId });
    throw new DatabaseConnectionError('fetching user bookings', error as Error);
  }
}

/**
 * Get a specific booking by ID (with user authorization)
 */
export async function getBookingById(
  bookingId: string,
  userId: string
): Promise<BookingWithDetails> {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId, // Ensure user can only access their own bookings
      },
      include: {
        course: true,
        user: true,
      },
    });

    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    return booking;
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      throw error;
    }

    logError(error, { operation: 'getBookingById', bookingId, userId });
    throw new DatabaseConnectionError('fetching booking by ID', error as Error);
  }
}

/**
 * Update booking payment status
 */
export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus
): Promise<Booking> {
  try {
    // Validate the payment status
    if (!isValidBookingStatus(paymentStatus)) {
      throw new InvalidBookingStatusError('UNKNOWN', paymentStatus);
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Validate status transition
    if (
      !isValidStatusTransition(existingBooking.paymentStatus, paymentStatus)
    ) {
      throw new InvalidBookingStatusError(
        existingBooking.paymentStatus,
        paymentStatus
      );
    }

    return await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        paymentStatus,
      },
    });
  } catch (error) {
    if (
      error instanceof BookingNotFoundError ||
      error instanceof InvalidBookingStatusError
    ) {
      throw error;
    }

    logError(error, {
      operation: 'updateBookingPaymentStatus',
      bookingId,
      paymentStatus,
    });
    throw new DatabaseConnectionError(
      'updating booking payment status',
      error as Error
    );
  }
}

/**
 * Cancel a booking (user authorized)
 */
export async function cancelBooking(
  bookingId: string,
  _userId: string
): Promise<Booking> {
  return updateBookingPaymentStatus(bookingId, PaymentStatus.CANCELLED);
}

/**
 * Get booking statistics for a user
 */
export async function getUserBookingStats(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
    },
  });

  return {
    total: bookings.length,
    pending: bookings.filter(b => b.paymentStatus === PaymentStatus.PENDING)
      .length,
    confirmed: bookings.filter(b => b.paymentStatus === PaymentStatus.PAID)
      .length,
    cancelled: bookings.filter(b => b.paymentStatus === PaymentStatus.CANCELLED)
      .length,
  };
}

/**
 * Check if user has booked a specific course
 */
export async function hasUserBookedCourse(
  userId: string,
  courseId: string
): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  return !!booking;
}

/**
 * Get all bookings for admin view (with pagination)
 */
export async function getAllBookings(
  limit: number = 50,
  offset: number = 0
): Promise<BookingListResponse> {
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        course: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.booking.count(),
  ]);

  return {
    bookings,
    total,
  };
}

/**
 * Validate booking status
 */
export function isValidBookingStatus(status: string): boolean {
  const normalized = status.toUpperCase();
  return (Object.values(PaymentStatus) as string[]).includes(normalized);
}

/**
 * Validate booking status transition
 */
export function isValidStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): boolean {
  // Define valid status transitions
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ],
    // Learning Path (021): PRE_BOOKED can transition to PENDING (approved) or CANCELLED (rejected)
    [PaymentStatus.PRE_BOOKED]: [
      PaymentStatus.PENDING,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.PAID]: [
      PaymentStatus.CONFIRMED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.CONFIRMED]: [
      PaymentStatus.REFUNDED,
      PaymentStatus.CANCELLED,
    ],
    [PaymentStatus.FAILED]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
    [PaymentStatus.CANCELLED]: [], // Terminal state
    [PaymentStatus.REFUNDED]: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Format booking status for display
 */
export function formatBookingStatus(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'Pending Payment';
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.CONFIRMED:
      return 'Confirmed';
    case PaymentStatus.FAILED:
      return 'Payment Failed';
    case PaymentStatus.CANCELLED:
      return 'Cancelled';
    case PaymentStatus.REFUNDED:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}

/**
 * Get booking status color for UI
 */
export function getBookingStatusColor(
  status: PaymentStatus
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'warning';
    case PaymentStatus.PAID:
      return 'success';
    case PaymentStatus.FAILED:
      return 'error';
    case PaymentStatus.CANCELLED:
      return 'error';
    case PaymentStatus.REFUNDED:
      return 'info';
    default:
      return 'default';
  }
}
