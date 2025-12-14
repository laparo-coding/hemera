import { auth, clerkClient } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverInstance } from '../../../../lib/monitoring/rollbar-official';
import {
  canUserBookCourse,
  createBooking,
} from '../../../../lib/services/booking';
import { getCourseById } from '../../../../lib/services/course';
import { createCheckoutSession } from '../../../../lib/services/stripe';

/**
 * Request validation schema for Stripe checkout
 */
const createCheckoutSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Rate limiting: Simple in-memory store (for production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for course booking
 *
 * Features:
 * - Authentication via Clerk
 * - Input validation with Zod
 * - Rate limiting per user
 * - Course availability validation
 * - Booking conflict detection
 * - Comprehensive error handling
 * - Structured logging
 */
export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  let userId: string | null = null;

  try {
    // 1. Authenticate user
    const auth_result = await auth();
    userId = auth_result.userId;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 2. Rate limiting check
    if (!checkRateLimit(userId)) {
      serverInstance.warn('Rate limit exceeded for checkout', {
        userId,
        requestId,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // Input validation
    const body = await req.json();
    const validatedData = createCheckoutSchema.parse(body);

    // Get user details from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userEmail =
      user.emailAddresses[0]?.emailAddress || 'noreply@example.com';

    // Verify course exists and is available
    const course = await getCourseById(validatedData.courseId);
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
          code: 'COURSE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course is not available for booking',
          code: 'COURSE_NOT_PUBLISHED',
        },
        { status: 400 }
      );
    }

    // Check booking eligibility and conflicts
    const eligibility = await canUserBookCourse(userId, course.id);
    if (!eligibility.canBook) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          code: 'BOOKING_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    serverInstance.info('Creating booking for checkout', {
      requestId,
      userId,
      courseId: course.id,
    });

    // Create booking with PENDING status
    const booking = await createBooking({
      userId,
      courseId: course.id,
      amount: course.price, // Already stored in cents (Int)
      currency: course.currency,
    });

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const courseSlug = course.slug || course.id;
    const successUrl =
      validatedData.successUrl ||
      `${baseUrl}/bookings/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`;
    const cancelUrl =
      validatedData.cancelUrl ||
      `${baseUrl}/courses/${courseSlug}?cancelled=true`;

    // Create Stripe checkout session
    const checkoutResult = await createCheckoutSession({
      courseId: course.id,
      courseName: course.title,
      coursePrice: course.price, // Already in cents
      userId,
      userEmail,
      successUrl,
      cancelUrl,
      bookingId: booking.id, // Pass booking ID for reference
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutResult.url,
        sessionId: checkoutResult.sessionId,
        bookingId: booking.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      },
    });
  } catch (error) {
    serverInstance.error(`Checkout creation failed [${requestId}]`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId || 'unknown',
      requestId,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle known error patterns
      if (error.message.includes('insufficient_funds')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment method has insufficient funds',
            code: 'INSUFFICIENT_FUNDS',
          },
          { status: 400 }
        );
      }

      if (error.message.includes('stripe')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment system error. Please try again.',
            code: 'PAYMENT_SYSTEM_ERROR',
          },
          { status: 502 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        code: 'INTERNAL_ERROR',
        requestId, // Include request ID for support
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/checkout
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Stripe checkout endpoint is operational',
    timestamp: new Date().toISOString(),
  });
}
