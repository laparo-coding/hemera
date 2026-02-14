import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus, getCurrentUser } from '../../../../lib/auth/helpers';
import { prisma } from '../../../../lib/db/prisma';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import { getCorsHeaders } from '../../../../lib/utils/cors';
import { getOrCreateRequestId } from '../../../../lib/utils/request-id';

// CORS headers for admin API access (origin restricted via getCorsHeaders)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Authentication check (uses test-friendly helpers to avoid Clerk calls in Jest)
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch (_e) {
      userId = null;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const filters =
      published !== null ? { isPublished: published === 'true' } : undefined;

    const courses = await prisma.course.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc', // Sort by nearest start time first per spec
      },
    });

      // Historically this endpoint returned a plain array for contract tests.
      // Return the courses array directly to preserve contract expectations.
      const res = NextResponse.json(courses, { status: 200 });
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.headers.set(key, value);
      });
      return res;
  } catch (_error) {
    const errorResponse = createErrorResponse(
      'Failed to fetch courses',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Authentication check (test-friendly)
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch (_e) {
      userId = null;
    }

    if (!userId) {
      return createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      return createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    // Parse and validate body
    const body = await request.json();

    // Basic validation - accept `startTime` (ISO) + optional `duration` (hours)
    if (!body.title || !body.description || body.price === undefined || !body.startTime) {
      return createErrorResponse(
        'Missing required fields',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    // Title length (3-200)
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 200) {
      return createErrorResponse(
        'Title must be between 3 and 200 characters',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    // Price must be a positive integer (cents)
    const priceVal = Number(body.price);
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      return createErrorResponse(
        'Price must be a positive number',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    // Parse startTime and compute endTime using duration (hours)
    const startTimeDate = new Date(body.startTime);
    if (isNaN(startTimeDate.getTime())) {
      return createErrorResponse(
        'Invalid startTime',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    // startTime must be in the future
    if (startTimeDate.getTime() <= Date.now()) {
      return createErrorResponse(
        'startTime must be a future date',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    const durationHours = Number(body.duration ?? 4);
    if (isNaN(durationHours) || durationHours <= 0) {
      return createErrorResponse(
        'Invalid duration',
        'VALIDATION_FAILED',
        requestId,
        400
      );
    }

    const endTimeDate = new Date(startTimeDate.getTime() + durationHours * 3600 * 1000);

    // Generate slug (keep deterministic but append timestamp to avoid unique collisions in tests)
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 40)
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // Create course using our database helper
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        slug,
        price: body.price,
        startDate: startTimeDate,
        startTime: startTimeDate,
        endTime: endTimeDate,
        instructor: body.instructor || 'TBD',
        level: body.level || 'BEGINNER',
        thumbnailUrl: body.thumbnailUrl || null,
        capacity: body.capacity || 20,
        currency: 'EUR',
        isPublished: false,
      },
    });

    const enrollmentCount = await prisma.booking.count({
      where: { courseId: course.id },
    });

    return NextResponse.json(
      {
        ...course,
        enrollmentCount,
        requestId,
      },
      { status: 201 }
    );
  } catch (_error) {
    return createErrorResponse(
      'Failed to create course',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
