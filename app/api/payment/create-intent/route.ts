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
      return NextResponse.json(
        { error: 'Course reference (id or slug) is required' },
        { status: 400 }
      );
    }

    // Get course details (resolve by id or slug)
    const course = await getCourseByIdOrSlug(courseRef);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Ensure the Clerk user exists in the local database before booking creation
    const syncedUser = await getCurrentUserWithSync();
    userId = syncedUser.id;

    // Create booking with initial PENDING status
    const booking = await createBooking({
      userId: syncedUser.id,
      courseId: course.id,
      amount: course.price,
      currency: course.currency,
    });

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      // Amounts are stored in whole euros in DB, Stripe service converts to cents
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
    const context = {
      error: errorMessage,
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
    return NextResponse.json(
      { error: 'Payment intent creation failed' },
      { status: 500 }
    );
  }
}
