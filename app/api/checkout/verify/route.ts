import { currentUser } from '@clerk/nextjs/server';
import { PaymentStatus, Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { syncClerkUserToDatabase } from '../../../../lib/api/users';
import { prisma } from '../../../../lib/db/prisma';
import { STRIPE_API_VERSION } from '../../../../lib/stripe/config';
import {
  isClerkDisabled,
  getE2ETestUserId,
} from '../../../../lib/utils/clerk-disabled-check';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Skip Stripe initialization during build process
const isBuildTime =
  process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY;

// Create stripe instance only at runtime
const createStripeInstance = () => {
  if (isBuildTime) {
    // Build time detected - skipping Stripe verify initialization
    return null;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured for checkout verification'
    );
  }

  return new Stripe(stripeKey, {
    apiVersion: STRIPE_API_VERSION,
  });
};

export async function GET(request: NextRequest) {
  try {
    // Handle build time gracefully
    if (isBuildTime) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Verification service temporarily unavailable during deployment',
        },
        { status: 503 }
      );
    }

    const stripe = createStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Payment verification service unavailable' },
        { status: 503 }
      );
    }

    const user = await currentUser();
    if (!user?.id) {
      // E2E test fallback: when Clerk is disabled, return test-friendly response
      if (isClerkDisabled()) {
        return NextResponse.json(
          {
            success: true,
            message: 'E2E test mode: Clerk disabled, skipping verification',
            booking: null,
            mockMode: true,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Attempt to find an existing booking by session id first (handles webhook-first flows)
    let booking = await prisma.booking.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
      include: {
        course: {
          select: {
            title: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    if (booking && booking.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'This payment is linked to another account' },
        { status: 403 }
      );
    }

    let session: Stripe.Checkout.Session | null = null;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });
    } catch (stripeError) {
      // If Stripe no longer has the session but we already recorded a paid booking, trust our DB
      if (
        booking &&
        booking.paymentStatus === PaymentStatus.PAID &&
        stripeError instanceof Stripe.errors.StripeError &&
        stripeError.code === 'resource_missing'
      ) {
        return NextResponse.json({
          success: true,
          booking: {
            id: booking.id,
            courseTitle: booking.course.title,
            price: booking.amount ?? 0,
            currency: booking.currency ?? 'EUR',
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt,
          },
        });
      }

      throw stripeError;
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 404 }
      );
    }

    // If bookingId metadata is present, prefer that record
    const metadataBookingId = session.metadata?.bookingId;
    if (metadataBookingId) {
      const bookingFromMetadata = await prisma.booking.findUnique({
        where: { id: metadataBookingId },
        include: {
          course: {
            select: {
              title: true,
              price: true,
              currency: true,
            },
          },
        },
      });

      if (bookingFromMetadata) {
        booking = bookingFromMetadata;
      }
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    // Determine course association (prefer metadata, fall back to existing booking)
    const courseId = session.metadata?.courseId ?? booking?.courseId;
    const metadataUserId = session.metadata?.userId ?? booking?.userId;

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to determine course for this payment',
        },
        { status: 400 }
      );
    }

    if (metadataUserId && metadataUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment metadata does not match the current user',
        },
        { status: 403 }
      );
    }

    // Ensure the user exists in our database (upsert from Clerk)
    await syncClerkUserToDatabase(
      user.id,
      user.primaryEmailAddress?.emailAddress || null,
      user.fullName || user.firstName || null,
      user.imageUrl || null
    );

    // Check if booking already exists (to prevent duplicates)
    // Check for existing booking by user & course if not already found by session
    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          userId: user.id,
          courseId,
        },
        include: {
          course: {
            select: {
              title: true,
              price: true,
              currency: true,
            },
          },
        },
      });
    }

    const course = booking
      ? null
      : await prisma.course.findUnique({
          where: { id: courseId },
        });

    if (!booking && !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const calculatedAmount =
      session.amount_total ?? booking?.amount ?? course?.price ?? 0;
    const calculatedCurrency =
      session.currency?.toUpperCase() ??
      booking?.currency ??
      course?.currency ??
      'USD';

    const bookingUpdateData = {
      paymentStatus: PaymentStatus.PAID,
      stripeSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId,
      amount: calculatedAmount,
      currency: calculatedCurrency,
    };

    try {
      if (!booking) {
        booking = await prisma.booking.upsert({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId,
            },
          },
          create: {
            userId: user.id,
            courseId,
            ...bookingUpdateData,
          },
          update: bookingUpdateData,
          include: {
            course: {
              select: {
                title: true,
                price: true,
                currency: true,
              },
            },
          },
        });
      } else {
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: bookingUpdateData,
          include: {
            course: {
              select: {
                title: true,
                price: true,
                currency: true,
              },
            },
          },
        });
      }
    } catch (bookingError: unknown) {
      if (
        bookingError instanceof Prisma.PrismaClientKnownRequestError &&
        bookingError.code === 'P2002'
      ) {
        const existingBooking = await prisma.booking.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId,
            },
          },
          include: {
            course: {
              select: {
                title: true,
                price: true,
                currency: true,
              },
            },
          },
        });

        if (existingBooking) {
          booking = await prisma.booking.update({
            where: { id: existingBooking.id },
            data: bookingUpdateData,
            include: {
              course: {
                select: {
                  title: true,
                  price: true,
                  currency: true,
                },
              },
            },
          });
        } else {
          throw bookingError;
        }
      } else {
        throw bookingError;
      }
    }

    if (!booking) {
      throw new Error('Failed to finalize booking after payment.');
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        courseTitle: booking.course.title,
        price: booking.amount ?? 0,
        currency: booking.currency ?? 'EUR',
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode ?? 502 }
      );
    }

    const message =
      error instanceof Error ? error.message : 'Failed to verify payment';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
