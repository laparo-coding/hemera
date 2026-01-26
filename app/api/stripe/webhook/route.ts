import { PaymentStatus } from '@prisma/client';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateBookingPaymentStatus } from '../../../../lib/api/bookings';
import { ErrorSeverity, reportError } from '../../../../lib/monitoring/rollbar';
import { STRIPE_API_VERSION } from '../../../../lib/stripe/config';

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

  return new Stripe(stripeKey, {
    apiVersion: STRIPE_API_VERSION,
  });
};

const getWebhookSecret = () => {
  if (isBuildTime) return '';
  return process.env.STRIPE_WEBHOOK_SECRET || '';
};

/**
 * Idempotency store to prevent duplicate webhook processing
 * Map stores event ID -> timestamp for TTL-based eviction
 * In production, use Redis or a database
 */
const processedEvents = new Map<string, number>();
const _EVENT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours (legacy, now using 1 hour TTL)
const EVENT_TTL = 3600000; // 1 hour TTL for event deduplication

// Clean up old events periodically
setInterval(
  () => {
    const now = Date.now();
    processedEvents.forEach((timestamp, eventId) => {
      if (now - timestamp > EVENT_TTL) {
        processedEvents.delete(eventId);
      }
    });
  },
  60 * 60 * 1000
); // Clean every hour

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * Features:
 * - Webhook signature verification
 * - Idempotency handling
 * - Event processing with retries
 * - Booking status updates
 * - Comprehensive error handling
 * - Audit logging
 */
export async function POST(request: NextRequest) {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let eventId: string | undefined;

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
    const webhookSecret = getWebhookSecret();

    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Stripe service unavailable' },
        { status: 503 }
      );
    }

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    // Get Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Stripe signature',
          code: 'MISSING_SIGNATURE',
        },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empty request body',
          code: 'EMPTY_BODY',
        },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    // Store event ID for error handling
    eventId = event.id;

    // Check for idempotency - prevent duplicate processing within TTL window
    if (processedEvents.has(event.id)) {
      return NextResponse.json({
        success: true,
        message: 'Event already processed',
        eventId: event.id,
      });
    }

    // Mark event as being processed with timestamp for TTL-based eviction
    processedEvents.set(event.id, Date.now());

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const { courseId, userId, bookingId } = session.metadata || {};

        if (!courseId || !userId) {
          reportError(
            `[${requestId}] Missing required metadata in checkout session`,
            {
              requestId,
              additionalData: { sessionId: session.id, courseId, userId },
            },
            ErrorSeverity.ERROR
          );
          break;
        }

        // Update booking status to PAID
        if (bookingId) {
          await updateBookingPaymentStatus(bookingId, PaymentStatus.PAID);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Extract metadata
        const { bookingId } = paymentIntent.metadata || {};

        if (bookingId) {
          await updateBookingPaymentStatus(bookingId, PaymentStatus.FAILED);
          reportError(
            `[${requestId}] Payment failed for booking`,
            {
              requestId,
              additionalData: {
                bookingId,
                paymentIntentId: paymentIntent.id,
                error: paymentIntent.last_payment_error?.message,
              },
            },
            ErrorSeverity.WARNING
          );
        }

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Extract metadata
        const { bookingId } = paymentIntent.metadata || {};

        if (bookingId) {
          await updateBookingPaymentStatus(bookingId, PaymentStatus.CANCELLED);
        }

        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        reportError(
          `[${requestId}] Dispute created`,
          {
            requestId,
            additionalData: {
              disputeId: dispute.id,
              amount: dispute.amount,
              reason: dispute.reason,
              chargeId: dispute.charge,
            },
          },
          ErrorSeverity.WARNING
        );

        // TODO: Handle dispute - potentially mark booking as disputed
        // Could trigger notification to admins

        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as unknown as {
          id: string;
          subscription?: string;
          amount_paid?: number;
          amount_due?: number;
        };
        // Handle subscription payments if applicable
        break;
      }

      default: {
        // Unhandled event type - silently ignore
        break;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventId: event.id,
      eventType: event.type,
    });
  } catch (error) {
    // Remove from processed map on error to allow retry
    // This enables Stripe to retry failed webhooks
    if (eventId) {
      processedEvents.delete(eventId);
    }

    reportError(
      error instanceof Error
        ? error
        : `[${requestId}] Webhook processing failed`,
      { requestId },
      ErrorSeverity.ERROR
    );

    if (error instanceof Error) {
      // Handle specific Stripe errors
      if (error.message.includes('Invalid signature')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid webhook signature',
            code: 'INVALID_SIGNATURE',
          },
          { status: 401 }
        );
      }

      if (error.message.includes('Webhook endpoint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Webhook configuration error',
            code: 'WEBHOOK_CONFIG_ERROR',
          },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        code: 'WEBHOOK_ERROR',
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/webhook
 * Health check endpoint for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stripe webhook endpoint is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
