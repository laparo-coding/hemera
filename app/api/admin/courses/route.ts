import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../lib/auth/helpers';
import { prisma } from '../../../../lib/db/prisma';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../lib/utils/request-id';

// CORS headers for external app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      // In E2E test mode, auth() might fail, return 401
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

    const response = createSuccessResponse(
      {
        courses,
        total: courses.length,
      },
      requestId
    );

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
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
    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      return createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
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

    // Basic validation - full validation done by server action
    if (!body.title || !body.description || !body.price || !body.startTime) {
      return createErrorResponse(
        'Missing required fields',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
    }

    // Create course using our database helper
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        slug: body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 50),
        price: body.price,
        startDate: new Date(body.startDate),
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
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
