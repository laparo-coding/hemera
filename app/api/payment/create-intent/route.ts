import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithSync } from '../../../../lib/api/users';
import { StripeConfigurationError } from '../../../../lib/errors';
import { serverInstance } from '../../../../lib/monitoring/rollbar-official';
import { createBooking } from '../../../../lib/services/booking';
import { getCourseByIdOrSlug } from '../../../../lib/services/course';
import {
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
      serverInstance.error('User sync failed', {
        error:
          syncError instanceof Error ? syncError.message : String(syncError),
        clerkUserId: userId,
      });
      return NextResponse.json(
        { error: 'Benutzer konnte nicht synchronisiert werden' },
        { status: 500 }
      );
    }

    // Create booking with initial PENDING status
    let booking;
    try {
      booking = await createBooking({
        userId: syncedUser.id,
        courseId: course.id,
        amount: course.price,
        currency: course.currency,
      });
    } catch (bookingError) {
      const message =
        bookingError instanceof Error
          ? bookingError.message
          : String(bookingError);
      serverInstance.error('Booking creation failed', {
        error: message,
        userId: syncedUser.id,
        courseId: course.id,
      });
      // Pass through meaningful errors like "Course is full"
      if (message.includes('full') || message.includes('not published')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json(
        { error: 'Buchung konnte nicht erstellt werden' },
        { status: 500 }
      );
    }

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
          bookingId: booking.id,
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
        bookingId: booking.id,
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
      bookingId: booking.id,
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
