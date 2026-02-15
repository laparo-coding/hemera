import { randomBytes } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  checkUserAdminStatus,
  getCurrentUser,
} from '../../../../lib/auth/helpers';
import { prisma } from '../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../lib/monitoring/rollbar-official';
import {
  type CourseCreateInput,
  courseCreateSchema,
} from '../../../../lib/schemas/admin/course';
import {
  createErrorResponse,
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
        'Du bist nicht autorisiert',
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
        'Du brauchst Admin-Rechte',
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
        'Du bist nicht autorisiert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      return createErrorResponse(
        'Du brauchst Admin-Rechte',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    // Parse and validate body
    const body = await request.json();

    let parsed: CourseCreateInput;
    try {
      parsed = await courseCreateSchema.parseAsync(body);
    } catch (zErr) {
      if (zErr instanceof ZodError) {
        rollbar.warning('Validation failed creating course', {
          requestId,
          issues: zErr.issues,
          route: '/api/admin/courses',
          // Do not include raw input to avoid logging PII
          inputSummary: {
            keys: Object.keys(body || {}),
            count: Object.keys(body || {}).length,
          },
        });

        return createErrorResponse(
          'Ungültige Eingaben beim Erstellen des Kurses',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400,
          { issues: zErr.issues }
        );
      }
      throw zErr;
    }

    // Compute endTime if not provided using validated duration (default 4h).
    // Use `parsed` so any validated/transformed `duration` is preferred; fall back to 4.
    const durationHours = Number(parsed.duration ?? 4);
    const startTimeDate = parsed.startTime;
    const endTimeDate =
      parsed.endTime ??
      new Date(startTimeDate.getTime() + durationHours * 3600 * 1000);

    // Generate slug base and append random hex fragment
    const baseSlug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 40)
      .replace(/(^-|-$)/g, '');

    let createdCourse = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const suffix = randomBytes(3).toString('hex');
      const slug = `${baseSlug}-${suffix}`;

      try {
        // Ensure price is persisted as integer cents.
        const priceToPersist = Number.isInteger(parsed.price)
          ? parsed.price
          : Math.round(parsed.price);

        createdCourse = await prisma.course.create({
          data: {
            title: parsed.title,
            description: parsed.description,
            slug,
            price: priceToPersist,
            startDate: parsed.startDate as Date,
            startTime: startTimeDate,
            endTime: endTimeDate,
            instructor: parsed.instructor,
            level: parsed.level,
            thumbnailUrl: parsed.thumbnailUrl ?? null,
            capacity: parsed.capacity ?? 20,
            currency: 'EUR',
            isPublished: parsed.isPublished ?? false,
            curriculum: parsed.curriculum ?? undefined,
            locationId: parsed.locationId ?? undefined,
          },
        });

        break;
      } catch (createErr: any) {
        lastError = createErr;
        // Prisma unique constraint on slug (P2002) -> retry
        if (
          createErr?.code === 'P2002' &&
          createErr?.meta?.target?.includes('slug')
        ) {
          // try again with a new suffix
          continue;
        }

        throw createErr;
      }
    }

    if (!createdCourse) {
      rollbar.error(
        'Failed to create course after retries',
        lastError as Error,
        {
          requestId,
          route: '/api/admin/courses',
        }
      );

      return createErrorResponse(
        'Konnte Kurs nicht erstellen',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      );
    }

    // New course has zero enrollments immediately after creation — avoid extra DB roundtrip
    const enrollmentCount = 0;

    return NextResponse.json(
      {
        ...createdCourse,
        enrollmentCount,
        requestId,
      },
      { status: 201 }
    );
  } catch (_error) {
    rollbar.error('Failed to create course (unexpected)', _error as Error, {
      requestId,
      route: '/api/admin/courses',
    });

    return createErrorResponse(
      'Konnte Kurs nicht erstellen',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
