import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { StripeConfigurationError } from '../../../../lib/errors';
import { serverInstance } from '../../../../lib/monitoring/rollbar-official';
import { updateBookingStatus } from '../../../../lib/services/booking';
import {
  isStripeConfigured,
  retrievePaymentIntent,
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

    // Parse request body
    const { paymentIntentId } = await request.json();
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment Intent not found' },
        { status: 404 }
      );
    }

    // Verify payment belongs to authenticated user
    if (paymentIntent.metadata?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update booking status based on payment status
    if (paymentIntent.status === 'succeeded') {
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
        await updateBookingStatus({
          id: bookingId,
          status: 'CONFIRMED',
          stripePaymentIntentId: paymentIntent.id,
        });
      }

      return NextResponse.json({
        status: 'succeeded',
        bookingId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json({
      status: paymentIntent.status,
      message: getPaymentStatusMessage(paymentIntent.status),
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

    serverInstance.error('Payment confirmation failed', context);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

function getPaymentStatusMessage(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'Payment successful!';
    case 'processing':
      return 'Payment is processing...';
    case 'requires_payment_method':
      return 'Payment failed. Please try again.';
    case 'requires_confirmation':
      return 'Payment requires confirmation.';
    case 'requires_action':
      return 'Payment requires additional action.';
    case 'canceled':
      return 'Payment was canceled.';
    default:
      return 'Payment status unknown.';
  }
}
