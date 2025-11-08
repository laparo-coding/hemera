import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Skip Stripe initialization during build process
const isBuildTime =
  process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY;

// Create stripe instance only at runtime
const createStripeInstance = () => {
  if (isBuildTime) {
    // Build time detected - skipping Stripe webhook initialization
    return null;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured for webhook processing'
    );
  }

  // Safety check for localhost development
  const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
  if (isLocalhost && !stripeKey.startsWith('sk_test_')) {
    // WARNING: Using live Stripe key on localhost! This should be a test key.
  }

  return new Stripe(stripeKey, {
    apiVersion: '2025-10-29.clover',
  });
};

const getEndpointSecret = () => {
  if (isBuildTime) return '';
  return process.env.STRIPE_WEBHOOK_SECRET || '';
};

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Handle build time gracefully
    if (isBuildTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook service temporarily unavailable during deployment',
        },
        { status: 503 }
      );
    }

    const stripe = createStripeInstance();
    const endpointSecret = getEndpointSecret();

    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Stripe service unavailable' },
        { status: 503 }
      );
    }

    if (!endpointSecret) {
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      // Missing Stripe signature
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      // Webhook signature verification failed
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Processing Stripe webhook event: ${event.type}

    // Process the webhook event based on type
    const result = { success: true, processed: false };

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Checkout session completed: ${session.id}

        // Update booking status to PAID
        // TODO: Implement booking status update logic
        result.processed = true;
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Payment intent succeeded: ${paymentIntent.id}
        result.processed = true;
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        // Payment intent failed: ${failedPaymentIntent.id}
        result.processed = true;
        break;

      default:
        // Unhandled event type: ${event.type}
        result.processed = false;
    }

    if (result.success) {
      // Webhook processed successfully
      return NextResponse.json({ received: true, ...result });
    } else {
      // Webhook processing failed
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    // Stripe webhook error
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
