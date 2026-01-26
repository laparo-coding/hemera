/**
 * Booking Categorization Utility
 *
 * Categorizes user bookings into 4 dashboard sections:
 * - Nächstes Seminar (next upcoming course)
 * - Weitere gebuchte Seminare (other upcoming courses)
 * - Absolvierte Seminare (completed courses with participation)
 * - Seminare ohne Teilnahme (past courses without participation)
 */

import type { PaymentStatus } from '@prisma/client';

/**
 * Booking data required for categorization
 */
export interface BookingForCategorization {
  id: string;
  paymentStatus: PaymentStatus;
  course: {
    startDate: Date | null;
    endDate: Date | null;
  };
  participation: { id: string } | null;
}

/**
 * Result of booking categorization
 */
export interface CategorizedBookings {
  /** The next upcoming seminar (earliest startDate in the future) */
  nextSeminar: BookingForCategorization | null;
  /** Other upcoming seminars (after the next one) */
  upcoming: BookingForCategorization[];
  /** Completed seminars (past + has participation record) */
  completed: BookingForCategorization[];
  /** Seminars without participation (past + no participation record) */
  noShow: BookingForCategorization[];
}

/**
 * Statuses considered as "cancelled" or "inactive"
 */
const INACTIVE_STATUSES: PaymentStatus[] = ['CANCELLED', 'FAILED'];

/**
 * Get the effective end date of a course.
 * Falls back to startDate if endDate is not set (single-day courses).
 */
function getCourseEndDate(booking: BookingForCategorization): Date | null {
  return booking.course.endDate || booking.course.startDate;
}

/**
 * Get the sort date for a booking (earliest date available).
 * Bookings without dates sort to the end (far future).
 */
function getSortDate(booking: BookingForCategorization): number {
  const startDate = booking.course.startDate?.getTime();
  const endDate = booking.course.endDate?.getTime();
  if (startDate != null) return startDate;
  if (endDate != null) return endDate;
  // No date: sort to far future (end of list)
  return Number.MAX_SAFE_INTEGER;
}

/**
 * Categorizes bookings into the 4 dashboard sections.
 *
 * Rules:
 * 1. Cancelled/Failed bookings are excluded from all sections
 * 2. A course is "upcoming" if its end date is in the future OR has no date
 * 3. A course is "past" if its end date is in the past
 * 4. Past courses with a participation record go to "completed"
 * 5. Past courses without participation go to "noShow"
 * 6. Upcoming courses are sorted by startDate ascending (no date = end)
 * 7. The first upcoming course becomes "nextSeminar"
 *
 * @param bookings Array of bookings to categorize
 * @param now Reference date for comparison (defaults to current time)
 * @returns Categorized bookings object
 */
export function categorizeBookings(
  bookings: BookingForCategorization[],
  now: Date = new Date()
): CategorizedBookings {
  // Filter out cancelled/failed bookings
  const activeBookings = bookings.filter(
    b => !INACTIVE_STATUSES.includes(b.paymentStatus)
  );

  // Separate into upcoming and past based on course end date
  // Bookings without dates are treated as upcoming (sorted to end)
  const upcomingBookings = activeBookings
    .filter(b => {
      const endDate = getCourseEndDate(b);
      // No date OR end date in future = upcoming
      return !endDate || endDate > now;
    })
    .sort((a, b) => getSortDate(a) - getSortDate(b));

  const pastBookings = activeBookings.filter(b => {
    const endDate = getCourseEndDate(b);
    // Only courses with an end date in the past
    return endDate && endDate <= now;
  });

  // Extract next seminar (first upcoming)
  const nextSeminar = upcomingBookings[0] ?? null;

  // Remaining upcoming seminars
  const upcoming = upcomingBookings.slice(1);

  // Split past bookings by participation status
  const completed = pastBookings.filter(b => b.participation !== null);
  const noShow = pastBookings.filter(b => b.participation === null);

  return {
    nextSeminar,
    upcoming,
    completed,
    noShow,
  };
}

/**
 * Checks if a booking belongs to a specific section.
 * Useful for filtering and section-specific logic.
 */
export function getBookingSection(
  booking: BookingForCategorization,
  allBookings: BookingForCategorization[],
  now: Date = new Date()
): 'nextSeminar' | 'upcoming' | 'completed' | 'noShow' | 'excluded' {
  // Check if cancelled/failed
  if (INACTIVE_STATUSES.includes(booking.paymentStatus)) {
    return 'excluded';
  }

  const endDate = getCourseEndDate(booking);

  // No date = treated as upcoming (uses categorize to determine position)
  // Past = completed or noShow based on participation
  if (endDate && endDate <= now) {
    return booking.participation ? 'completed' : 'noShow';
  }

  // It's upcoming (or no date) - check if it's the next one
  const categorized = categorizeBookings(allBookings, now);
  if (categorized.nextSeminar?.id === booking.id) {
    return 'nextSeminar';
  }

  return 'upcoming';
}
