import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithSync } from '../../../../lib/api/users';
import { prisma } from '../../../../lib/db/prisma';
import { StripeConfigurationError } from '../../../../lib/errors';
import { serverInstance } from '../../../../lib/monitoring/rollbar-official';
import { handleBookingWithPrerequisites } from '../../../../lib/services/booking-orchestrator';
import {
  getCourseByIdOrSlug,
  PaymentStatus,
} from '../../../../lib/services/course';
import {
  cancelPaymentIntent,
  createPaymentIntent,
  isStripeConfigured,
} from '../../../../lib/services/stripe';

const STRIPE_UNAVAILABLE_ERROR =
  'Stripe payments are temporarily unavailable. Please contact support.';

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  try {
    // Authenticate user
    const authResult = await auth();
    userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: STRIPE_UNAVAILABLE_ERROR },
        { status: 503 }
      );
    }

    // Parse request body (accept id or slug for course reference)
    const body = await request.json();
    // Backward-compatible: allow { courseId } as today, but also accept { courseSlug } or { course }
    const courseRef: string | undefined =
      body?.courseId || body?.courseSlug || body?.course;
    if (!courseRef) {
      serverInstance.warn(
        'Missing course reference in payment intent request',
        {
          body,
          userId: userId || 'unknown',
        }
      );
      return NextResponse.json(
        { error: 'Course reference (id or slug) is required' },
        { status: 400 }
      );
    }

    // Get course details (resolve by id or slug)
    const course = await getCourseByIdOrSlug(courseRef);
    if (!course) {
      serverInstance.warn('Course not found for checkout', {
        courseRef,
        userId: userId || 'unknown',
      });
      return NextResponse.json(
        { error: 'Kurs nicht gefunden' },
        { status: 404 }
      );
    }

    // Ensure the Clerk user exists in the local database before booking creation
    let syncedUser;
    try {
      syncedUser = await getCurrentUserWithSync();
      userId = syncedUser.id;
    } catch (syncError) {
      const errorMsg =
        syncError instanceof Error ? syncError.message : String(syncError);
      serverInstance.error('User sync failed', {
        error: errorMsg,
        stack: syncError instanceof Error ? syncError.stack : undefined,
        clerkUserId: userId,
      });
      return NextResponse.json(
        { error: `Benutzer-Sync fehlgeschlagen: ${errorMsg}` },
        { status: 500 }
      );
    }

    // Learning Path (021): Orchestrator handles prerequisite check + booking creation
    // But first: check if the user already has a PENDING booking for this course.
    // If so, resume by creating a fresh payment intent for the existing booking.
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_courseId: {
          userId: syncedUser.id,
          courseId: course.id,
        },
      },
    });

    if (
      existingBooking &&
      existingBooking.paymentStatus === PaymentStatus.PENDING
    ) {
      serverInstance.info('Resuming checkout for existing PENDING booking', {
        bookingId: existingBooking.id,
        userId: syncedUser.id,
        courseId: course.id,
      });

      // Cancel previous Stripe PaymentIntent if present (best-effort)
      if (existingBooking.stripePaymentIntentId) {
        try {
          await cancelPaymentIntent(existingBooking.stripePaymentIntentId);
        } catch (cancelError) {
          // Non-blocking: old PI may already be expired/cancelled
          serverInstance.info('Could not cancel previous payment intent', {
            previousPiId: existingBooking.stripePaymentIntentId,
            error:
              cancelError instanceof Error
                ? cancelError.message
                : String(cancelError),
          });
        }
      }

      // Use persisted booking amount/currency (not current course price)
      let paymentIntent;
      try {
        paymentIntent = await createPaymentIntent({
          amount: existingBooking.amount,
          currency: existingBooking.currency.toLowerCase(),
          courseId: course.id,
          userId: syncedUser.id,
          metadata: {
            courseId: course.id,
            userId: syncedUser.id,
            bookingId: existingBooking.id,
            courseName: course.title,
          },
        });
      } catch (stripeError) {
        serverInstance.error('Stripe payment intent failed (resume)', {
          error:
            stripeError instanceof Error
              ? stripeError.message
              : String(stripeError),
          userId: syncedUser.id,
          courseId: course.id,
          bookingId: existingBooking.id,
        });
        return NextResponse.json(
          { error: 'Zahlungsabwicklung fehlgeschlagen' },
          { status: 500 }
        );
      }

      // Update booking with the new payment intent ID
      try {
        await prisma.booking.update({
          where: { id: existingBooking.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });
      } catch (updateError) {
        serverInstance.error(
          'Failed to update booking with new payment intent',
          {
            error:
              updateError instanceof Error
                ? updateError.message
                : String(updateError),
            bookingId: existingBooking.id,
            paymentIntentId: paymentIntent.id,
            userId: syncedUser.id,
          }
        );
        // Attempt to cancel the orphaned payment intent
        try {
          await cancelPaymentIntent(paymentIntent.id);
        } catch (_) {
          // Best-effort cleanup
        }
        return NextResponse.json(
          {
            error:
              'Buchung konnte nicht aktualisiert werden. ' +
              'Bitte versuche es erneut.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: existingBooking.amount,
        currency: existingBooking.currency,
        courseName: course.title,
        bookingId: existingBooking.id,
      });
    }

    const orchestratorResult = await handleBookingWithPrerequisites({
      userId: syncedUser.id,
      userEmail: syncedUser.email,
      userName: syncedUser.name,
      course,
    });

    // Handle orchestrator errors
    if (!orchestratorResult.success) {
      const errorMsg = orchestratorResult.error || '';
      // TODO: Refactor orchestrator to return structured errorCode
      // instead of relying on string matching (see booking-orchestrator.ts)
      const isDuplicate = errorMsg.includes('gebucht');
      const isReview = errorMsg.includes('geprüft');
      return NextResponse.json(
        {
          error: errorMsg,
          ...(isDuplicate && { errorCode: 'DUPLICATE_BOOKING' }),
          ...(isReview && { errorCode: 'BOOKING_UNDER_REVIEW' }),
        },
        { status: 500 }
      );
    }

    // Handle PRE_BOOKED flow (requires admin review)
    if (orchestratorResult.requiresReview) {
      return NextResponse.json(
        {
          requiresReview: true,
          bookingId: orchestratorResult.bookingId,
          message: orchestratorResult.message,
          missingPrerequisite: orchestratorResult.missingPrerequisite,
        },
        { status: 202 }
      );
    }

    // Qualified: Booking created, now create payment intent
    const bookingId = orchestratorResult.bookingId;

    // Create payment intent
    let paymentIntent;
    try {
      paymentIntent = await createPaymentIntent({
        amount: course.price,
        currency: course.currency.toLowerCase(),
        courseId: course.id,
        userId: syncedUser.id,
        metadata: {
          courseId: course.id,
          userId: syncedUser.id,
          bookingId,
          courseName: course.title,
        },
      });
    } catch (stripeError) {
      serverInstance.error('Stripe payment intent failed', {
        error:
          stripeError instanceof Error
            ? stripeError.message
            : String(stripeError),
        userId: syncedUser.id,
        courseId: course.id,
        bookingId,
      });
      return NextResponse.json(
        { error: 'Zahlungsabwicklung fehlgeschlagen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: course.price,
      currency: course.currency,
      courseName: course.title,
      bookingId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const context = {
      error: errorMessage,
      stack: errorStack,
      userId: userId || 'unknown',
      timestamp: new Date().toISOString(),
    };

    if (error instanceof StripeConfigurationError) {
      serverInstance.warn('Stripe configuration missing', context);
      return NextResponse.json(
        { error: STRIPE_UNAVAILABLE_ERROR },
        { status: 503 }
      );
    }

    serverInstance.error('Payment intent creation failed', context);

    // Return more specific error messages for debugging
    const userMessage = errorMessage.includes('Course')
      ? errorMessage
      : errorMessage.includes('User')
        ? errorMessage
        : 'Payment intent creation failed';

    return NextResponse.json(
      {
        error: userMessage,
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
