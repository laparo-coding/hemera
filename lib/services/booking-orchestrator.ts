/**
 * Booking Orchestrator - Coordinates booking creation with prerequisites and notifications
 * Feature: 021-learning-path
 *
 * Centralizes complex booking workflows:
 * - Prerequisite checking
 * - PRE_BOOKED booking creation
 * - Admin notification emails
 * - Error handling and logging
 * - Type-safe result handling with discriminated unions
 *
 * Decouples API routes from business logic complexity.
 *
 * APPROVAL WORKFLOW:
 * 1. handleBookingWithPrerequisites() checks if user qualifies
 * 2. If not qualified → createPreBookedWithNotification()
 * 3. Admin receives email → reviews at /api/admin/bookings/{id}/review
 * 4. Approved → PENDING status → customer proceeds to payment
 * 5. Rejected → CANCELLED + rejection email sent
 *
 * RETURN TYPE SAFETY:
 * Uses discriminated union to guarantee consistent result shape:
 * - success: false → error field is always defined
 * - success: true, requiresReview: true → bookingId, message, missingPrerequisite always defined
 * - success: true, requiresReview: false → other fields are undefined
 * This prevents undefined property access in API routes.
 *
 * TODO: Add auto-approval rules for edge cases (e.g., completed during wait)
 * TODO: Add prerequisite verification (upload certificate)
 *
 * @see docs/features/021-learning-path/PRE_BOOKED_APPROVAL_WORKFLOW.md
 */

import { serverInstance } from '../monitoring/rollbar-official';
import { createBooking } from './booking';
import type { Course } from './course';
import {
  getAdminEmails,
  isLoopsConfigured,
  isValidEmail,
  sendPrerequisiteReviewEmail,
} from './loops';
import { checkPrerequisite } from './prerequisite';

// Discriminated union for type-safe orchestrator results
export type BookingOrchestratorResult =
  | {
      success: true;
      requiresReview: false;
      bookingId: string;
      message?: undefined;
      missingPrerequisite?: undefined;
      error?: undefined;
    }
  | {
      success: true;
      requiresReview: true;
      bookingId: string;
      message: string;
      missingPrerequisite: 'BEGINNER' | 'INTERMEDIATE';
      error?: undefined;
    }
  | {
      success: false;
      requiresReview?: undefined;
      bookingId?: undefined;
      message?: undefined;
      missingPrerequisite?: undefined;
      error: string;
    };

export interface CreateBookingWithPrerequisitesParams {
  userId: string;
  userEmail: string | null | undefined;
  userName: string | null | undefined;
  course: Course;
}

/**
 * Create a PRE_BOOKED booking and notify admins for review.
 * Centralized error handling - never throws, always returns result.
 */
export async function createPreBookedWithNotification(
  params: CreateBookingWithPrerequisitesParams,
  missingPrerequisite: 'BEGINNER' | 'INTERMEDIATE'
): Promise<BookingOrchestratorResult> {
  const { userId, userEmail, userName, course } = params;

  try {
    // Create booking with PRE_BOOKED status for admin review
    const pendingBooking = await createBooking({
      userId,
      courseId: course.id,
      amount: course.price,
      currency: course.currency,
      paymentStatus: 'PRE_BOOKED',
    });

    // Attempt to notify admins (non-blocking, logs on failure)
    await notifyAdminsForReview({
      bookingId: pendingBooking.id,
      userId,
      userEmail,
      userName,
      courseName: course.title,
      courseLevel: course.level as 'INTERMEDIATE' | 'ADVANCED',
      missingPrerequisite,
    });

    return {
      success: true,
      requiresReview: true,
      bookingId: pendingBooking.id,
      message:
        'Deine Buchung wurde zur Prüfung eingereicht. Du wirst benachrichtigt, sobald sie freigegeben wurde.',
      missingPrerequisite,
    };
  } catch (bookingError) {
    serverInstance.error('Failed to create PRE_BOOKED booking', {
      context: 'BookingOrchestrator.createPreBookedWithNotification',
      error:
        bookingError instanceof Error
          ? bookingError.message
          : String(bookingError),
      userId,
      courseId: course.id,
    });

    return {
      success: false,
      error: 'Buchung konnte nicht erstellt werden',
    };
  }
}

interface NotifyAdminsParams {
  bookingId: string;
  userId: string;
  userEmail: string | null | undefined;
  userName: string | null | undefined;
  courseName: string;
  courseLevel: 'INTERMEDIATE' | 'ADVANCED';
  missingPrerequisite: 'BEGINNER' | 'INTERMEDIATE';
}

/**
 * Notify admins about a booking pending review.
 * Non-blocking: Logs warnings on failure but does not throw.
 */
async function notifyAdminsForReview(
  params: NotifyAdminsParams
): Promise<void> {
  const {
    bookingId,
    userId,
    userEmail,
    userName,
    courseName,
    courseLevel,
    missingPrerequisite,
  } = params;

  try {
    // Guard: Validate customer email format first (no I/O)
    if (!isValidEmail(userEmail)) {
      serverInstance.warn(
        'Skipped prerequisite review email - invalid customer email',
        {
          context: 'BookingOrchestrator.notifyAdminsForReview',
          bookingId,
          userId,
          reason: 'Email is empty, null, or invalid format',
        }
      );
      return;
    }

    // Safe: isValidEmail ensures userEmail is non-null and valid
    const customerEmail = userEmail!.trim();

    // Guard: Check Loops API key (no I/O) - use silent since we log our own message
    if (!isLoopsConfigured(true)) {
      serverInstance.info(
        'Skipped prerequisite review email - Loops not configured',
        {
          context: 'BookingOrchestrator.notifyAdminsForReview',
          bookingId,
          userId,
        }
      );
      return;
    }

    // Only now fetch admin emails (requires database I/O)
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      serverInstance.warn(
        'Skipped prerequisite review email - no admin emails',
        {
          context: 'BookingOrchestrator.notifyAdminsForReview',
          bookingId,
          userId,
        }
      );
      return;
    }

    // Send notification email
    await sendPrerequisiteReviewEmail({
      customerName: userName?.split(' ')[0] || 'Teilnehmer',
      customerEmail,
      courseName,
      courseLevel,
      missingPrerequisite,
      bookingId,
      adminEmails,
    });
  } catch (emailError) {
    // Non-blocking: Log warning but don't fail the booking
    serverInstance.warn('Failed to send prerequisite review email', {
      context: 'BookingOrchestrator.notifyAdminsForReview',
      error:
        emailError instanceof Error ? emailError.message : String(emailError),
      bookingId,
      userId,
    });
  }
}

/**
 * Orchestrates booking creation with prerequisite checking.
 * Handles the COMPLETE workflow including booking creation:
 * 1. Validate course level
 * 2. Skip prerequisite check for BEGINNER courses
 * 3. Check prerequisites for INTERMEDIATE/ADVANCED
 * 4. If not qualified: Create PRE_BOOKED + notify admins → return bookingId
 * 5. If qualified: Create PENDING booking → return bookingId
 *
 * This function ALWAYS creates a booking (unless error), making the API route thin.
 * The caller only needs to check success/requiresReview and handle payment intent.
 *
 * @returns BookingOrchestratorResult with bookingId on success
 */
export async function handleBookingWithPrerequisites(
  params: CreateBookingWithPrerequisitesParams
): Promise<BookingOrchestratorResult> {
  const { userId, course } = params;

  // Guard: Validate course level
  if (!course.level) {
    serverInstance.error('Course level missing or invalid', {
      context: 'BookingOrchestrator.handleBookingWithPrerequisites',
      courseId: course.id,
      courseSlug: course.slug,
      userId,
    });

    return {
      success: false,
      error: 'Kursdaten sind unvollständig. Bitte kontaktiere den Support.',
    };
  }

  // BEGINNER courses: No prerequisites, create booking immediately
  if (course.level === 'BEGINNER') {
    try {
      const booking = await createBooking({
        userId,
        courseId: course.id,
        amount: course.price,
        currency: course.currency,
        paymentStatus: 'PENDING',
      });

      return {
        success: true,
        requiresReview: false,
        bookingId: booking.id,
      };
    } catch (bookingError) {
      const message =
        bookingError instanceof Error
          ? bookingError.message
          : String(bookingError);
      serverInstance.error('Failed to create BEGINNER booking', {
        context: 'BookingOrchestrator.handleBookingWithPrerequisites',
        error: message,
        userId,
        courseId: course.id,
      });

      return {
        success: false,
        error: message.includes('gebucht')
          ? message
          : 'Buchung konnte nicht erstellt werden',
      };
    }
  }

  // INTERMEDIATE/ADVANCED: Check prerequisites
  const prerequisiteResult = await checkPrerequisite(userId, course.level);

  // Not qualified: Create PRE_BOOKED booking and notify admins
  if (!prerequisiteResult.qualified) {
    // Guard: Ensure missingLevel is set when not qualified
    if (!prerequisiteResult.missingLevel) {
      serverInstance.error(
        'Prerequisite check returned not qualified but no missing level',
        {
          context: 'BookingOrchestrator.handleBookingWithPrerequisites',
          userId,
          courseId: course.id,
          courseLevel: course.level,
        }
      );
      return {
        success: false,
        error:
          'Voraussetzungsprüfung fehlgeschlagen. Bitte kontaktiere den Support.',
      };
    }

    return await createPreBookedWithNotification(
      params,
      prerequisiteResult.missingLevel
    );
  }

  // Qualified: Create normal PENDING booking
  try {
    const booking = await createBooking({
      userId,
      courseId: course.id,
      amount: course.price,
      currency: course.currency,
      paymentStatus: 'PENDING',
    });

    return {
      success: true,
      requiresReview: false,
      bookingId: booking.id,
    };
  } catch (bookingError) {
    const message =
      bookingError instanceof Error
        ? bookingError.message
        : String(bookingError);
    serverInstance.error('Failed to create qualified booking', {
      context: 'BookingOrchestrator.handleBookingWithPrerequisites',
      error: message,
      userId,
      courseId: course.id,
    });

    return {
      success: false,
      error: message.includes('gebucht')
        ? message
        : 'Buchung konnte nicht erstellt werden',
    };
  }
}
