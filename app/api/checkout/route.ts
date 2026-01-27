import { currentUser } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../../../lib/db/prisma';
import { STRIPE_API_VERSION } from '../../../lib/stripe/config';

// Skip Stripe initialization during build process
const isBuildTime =
  process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY;

// Create stripe instance only at runtime
const createStripeInstance = () => {
  // During build time, don't validate Stripe config
  if (isBuildTime) {
    return null;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. Add it to your environment variables.'
    );
  }

  // Safety check: Ensure test keys for localhost
  const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
  if (isLocalhost && !stripeKey.startsWith('sk_test_')) {
    throw new Error(
      'Live Stripe keys are not allowed on localhost. Use test keys only.'
    );
  }

  return new Stripe(stripeKey, {
    apiVersion: STRIPE_API_VERSION,
  });
};

const createCheckoutSchema = z.object({
  courseId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/checkout
 * Create a Stripe checkout session for course booking
 */
export async function POST(request: NextRequest) {
  try {
    // Handle build time gracefully
    if (isBuildTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable during deployment',
        },
        { status: 503 }
      );
    }

    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    // Check if course exists
    const course = await prisma.course.findFirst({
      where: {
        id: validatedData.courseId,
        isPublished: true,
        isNonPublic: false, // Exclude Learning Path invite-only courses
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Ensure the user exists in our database (upsert from Clerk)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.fullName || user.firstName || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        image: user.imageUrl || null,
      },
      create: {
        id: user.id,
        name: user.fullName || user.firstName || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        image: user.imageUrl || null,
      },
    });

    // Check if user already has a booking for this course
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'You have already booked this course' },
        { status: 409 }
      );
    }

    // Create Stripe checkout session
    const stripe = createStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase(),
            product_data: {
              name: course.title,
              description: course.description || undefined,
            },
            unit_amount: course.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        validatedData.successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        validatedData.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/courses`,
      metadata: {
        courseId: course.id,
        userId: user.id,
      },
      customer_email: user.primaryEmailAddress?.emailAddress || undefined,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
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

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          type: error.type,
          requestId: error.requestId,
        },
        { status: error.statusCode ?? 502 }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create checkout session';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
