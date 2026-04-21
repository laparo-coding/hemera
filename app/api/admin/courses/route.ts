import { randomBytes } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAdminUser } from '../../../../lib/auth/helpers';
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
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
  getCorsHeaders,
} from '../../../../lib/utils/cors';
import { getOrCreateRequestId } from '../../../../lib/utils/request-id';

// CORS headers for admin API access (origin restricted via getCorsHeaders)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return createCorsPreflightResponse(corsHeaders);
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    const adminAuth = await requireAdminUser(requestId);
    if (!adminAuth.authorized) {
      return applyCorsHeaders(adminAuth.response, corsHeaders);
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
    return applyCorsHeaders(
      NextResponse.json(courses, { status: 200 }),
      corsHeaders
    );
  } catch (error) {
    rollbar.error(error instanceof Error ? error : new Error(String(error)), {
      requestId,
      route: 'GET /api/admin/courses',
    });

    return applyCorsHeaders(
      createErrorResponse(
        'Failed to fetch courses',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      ),
      corsHeaders
    );
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    const adminAuth = await requireAdminUser(requestId);
    if (!adminAuth.authorized) {
      return applyCorsHeaders(adminAuth.response, corsHeaders);
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch (_err) {
      return applyCorsHeaders(
        createErrorResponse(
          'Ungültiges JSON im Request Body',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400
        ),
        corsHeaders
      );
    }

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

        return applyCorsHeaders(
          createErrorResponse(
            'Ungültige Eingaben beim Erstellen des Kurses',
            ErrorCodes.VALIDATION_ERROR,
            requestId,
            400,
            { issues: zErr.issues }
          ),
          corsHeaders
        );
      }
      throw zErr;
    }

    // `courseCreateSchema` provides a validated `duration` default (4 hours)
    // and `price` is already transformed into integer cents. Use values
    // directly from `parsed` to preserve types/units from the schema.
    const durationHours = parsed.duration; // validated number (hours)
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
        // `courseCreateSchema` transforms a Euro decimal into integer cents
        // (e.g. 19.99 -> 1999). Use the transformed value directly so units
        // are explicit and consistent.
        const priceToPersist = parsed.price;

        createdCourse = await prisma.course.create({
          data: {
            title: parsed.title,
            description: parsed.description,
            slug,
            price: priceToPersist,
            startDate: parsed.startDate ?? undefined,
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
      } catch (createErr: unknown) {
        lastError = createErr;
        // Prisma unique constraint on slug (P2002) -> retry
        const isPrismaError =
          createErr != null &&
          typeof createErr === 'object' &&
          'code' in createErr;
        if (
          isPrismaError &&
          (createErr as { code: string }).code === 'P2002' &&
          (
            createErr as { meta?: { target?: string[] } }
          ).meta?.target?.includes('slug')
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

      return applyCorsHeaders(
        createErrorResponse(
          'Konnte Kurs nicht erstellen',
          ErrorCodes.INTERNAL_ERROR,
          requestId,
          500
        ),
        corsHeaders
      );
    }

    // New course has zero enrollments immediately after creation — avoid extra DB roundtrip
    const enrollmentCount = 0;

    return applyCorsHeaders(
      NextResponse.json(
        {
          ...createdCourse,
          enrollmentCount,
          requestId,
        },
        { status: 201 }
      ),
      corsHeaders
    );
  } catch (_error) {
    rollbar.error('Failed to create course (unexpected)', _error as Error, {
      requestId,
      route: '/api/admin/courses',
    });

    return applyCorsHeaders(
      createErrorResponse(
        'Konnte Kurs nicht erstellen',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      ),
      corsHeaders
    );
  }
}
