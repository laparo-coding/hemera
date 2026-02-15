/**
 * Admin Course API Routes - Single Course Operations
 * GET /api/admin/courses/[id] - Get course by ID
 * PATCH /api/admin/courses/[id] - Update course
 * DELETE /api/admin/courses/[id] - Delete course
 */

import type { Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  checkUserAdminStatus,
  getCurrentUser,
} from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance as rollbar } from '../../../../../lib/monitoring/rollbar-official';
import {
  type CourseUpdateInput,
  courseUpdateSchema,
  curriculumSchema,
} from '../../../../../lib/schemas/admin/course';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../lib/utils/api-response';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

/**
 * Check admin authentication
 */
async function checkAdminAuth(requestId: string) {
  // Use test-friendly getCurrentUser to avoid Clerk middleware failures in Jest
  let userId: string | null = null;
  try {
    const user = await getCurrentUser();
    userId = user?.id ?? null;
  } catch (_e) {
    userId = null;
  }

  if (!userId) {
    return {
      error: createErrorResponse(
        'Du bist nicht autorisiert',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      ),
      userId: null,
    };
  }

  const isAdmin = await checkUserAdminStatus(userId);
  if (!isAdmin) {
    return {
      error: createErrorResponse(
        'Du brauchst Admin-Rechte',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      ),
      userId: null,
    };
  }

  return { error: null, userId };
}

/**
 * GET /api/admin/courses/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!course) {
      return createErrorResponse(
        `Kurs mit der ID ${id} wurde nicht gefunden`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    return createSuccessResponse(
      {
        ...course,
        enrollmentCount: course._count.bookings,
      },
      requestId
    );
  } catch (error) {
    rollbar.error('Failed to fetch course by ID', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'GET',
    });

    return createErrorResponse(
      'Konnte Kurs nicht laden',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * PATCH /api/admin/courses/[id]
 * Update course with optimistic locking
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    const body = await request.json();

    // Validate update body using Zod (includes updatedAt coercion)
    let parsedUpdate: CourseUpdateInput;
    try {
      parsedUpdate = await courseUpdateSchema.parseAsync(body);
    } catch (zErr) {
      if (zErr instanceof ZodError) {
        rollbar.warning('Invalid course update payload', {
          requestId,
          issues: zErr.issues,
          courseId: id,
        });

        return createErrorResponse(
          'Ungültige Eingaben beim Aktualisieren des Kurses',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400,
          { issues: zErr.issues }
        );
      }
      throw zErr;
    }

    // Verify course exists and check updatedAt
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { updatedAt: true, _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    // Check for concurrent edit
    const providedUpdatedAt = new Date(parsedUpdate.updatedAt as Date);
    if (existing.updatedAt.getTime() !== providedUpdatedAt.getTime()) {
      rollbar.warning('Concurrent edit conflict detected', {
        requestId,
        courseId: id,
        providedUpdatedAt: providedUpdatedAt.toISOString(),
        actualUpdatedAt: existing.updatedAt.toISOString(),
        route: '/api/admin/courses/[id]',
      });

      return createErrorResponse(
        'Der Kurs wurde zwischenzeitlich von einem anderen Admin geändert. Bitte aktualisiere die Seite und versuche es erneut.',
        'CONCURRENT_EDIT_CONFLICT',
        requestId,
        409,
        { latestUpdatedAt: existing.updatedAt.toISOString() }
      );
    }

    // Check capacity constraint
    if (
      parsedUpdate.capacity !== undefined &&
      parsedUpdate.capacity < existing._count.bookings
    ) {
      rollbar.warning('Capacity below enrollment count', {
        requestId,
        courseId: id,
        requestedCapacity: parsedUpdate.capacity,
        currentEnrollments: existing._count.bookings,
        route: '/api/admin/courses/[id]',
      });

      return createErrorResponse(
        'Die maximale Teilnehmerzahl darf nicht kleiner sein als die bereits angemeldeten Teilnehmer.',
        'CAPACITY_BELOW_ENROLLMENTS',
        requestId,
        400,
        {
          currentEnrollmentCount: existing._count.bookings,
          requestedCapacity: parsedUpdate.capacity,
        }
      );
    }

    // Update course (use typed update shape inferred from Zod schema)
    const { updatedAt: _, ...updateData } = parsedUpdate;

    // Prisma update inputs must not contain `null` for optional fields that
    // are typed as `string | undefined` — strip explicit nulls so the typing
    // matches Prisma's generated types. If the admin intentionally wants to
    // unset a nullable relation/field we would need an explicit handling
    // (e.g. set to Prisma.Null), but for safety we omit nulls here.
    // Build a strictly-typed partial update object using Prisma types.
    type AllowedKeys =
      | 'title'
      | 'description'
      | 'teaser'
      | 'curriculum'
      | 'slug'
      | 'price'
      | 'currency'
      | 'capacity'
      | 'startDate'
      | 'endDate'
      | 'startTime'
      | 'endTime'
      | 'isPublished'
      | 'instructor'
      | 'level'
      | 'thumbnailUrl'
      | 'imageDetail'
      | 'imageTwitter'
      | 'heroVideoPlaybackId'
      | 'location'
      | 'recommended'
      | 'notRecommended'
      | 'isNonPublic';

    type AllowedUpdate = Partial<Pick<Prisma.CourseUpdateInput, AllowedKeys>>;

    const prismaUpdateData: AllowedUpdate = {};
    for (const k of Object.keys(updateData) as Array<keyof typeof updateData>) {
      const v = (updateData as Record<string, unknown>)[k as string];
      if (
        v !== null &&
        v !== undefined &&
        (
          [
            'title',
            'description',
            'teaser',
            'curriculum',
            'slug',
            'price',
            'currency',
            'capacity',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'isPublished',
            'instructor',
            'level',
            'thumbnailUrl',
            'imageDetail',
            'imageTwitter',
            'heroVideoPlaybackId',
            'locationId',
            'recommended',
            'notRecommended',
            'isNonPublic',
          ] as string[]
        ).includes(k as string)
      ) {
        // Type assertion is safe because AllowedUpdate restricts keys
        (prismaUpdateData as any)[k] = v;
      }
    }

    // Validate curriculum if provided
    if (updateData.curriculum !== undefined) {
      try {
        curriculumSchema.parse(updateData.curriculum);
      } catch (zodError) {
        if (zodError instanceof ZodError) {
          rollbar.warning('Invalid curriculum data in PATCH request', {
            requestId,
            courseId: id,
            issues: zodError.issues,
          });
          return createErrorResponse(
            'Ungültige Struktur für das Curriculum',
            ErrorCodes.VALIDATION_ERROR,
            requestId,
            400
          );
        }
        throw zodError;
      }
    }

    // Ensure price is stored as integer cents. `courseUpdateSchema` now
    // transforms decimal Euro amounts into integer cents when present.
    if (updateData.price !== undefined) {
      const priceCents = updateData.price as number;
      if (!Number.isInteger(priceCents) || priceCents < 0) {
        return createErrorResponse(
          'Ungültiger Preis',
          ErrorCodes.VALIDATION_ERROR,
          requestId,
          400
        );
      }

      // Ensure the computed prisma update payload contains the integer cents
      prismaUpdateData.price = priceCents;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: prismaUpdateData as Parameters<
        typeof prisma.course.update
      >[0]['data'],
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    rollbar.info('Course updated via API', {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'PATCH',
    });

    return createSuccessResponse(
      {
        ...updated,
        enrollmentCount: updated._count.bookings,
      },
      requestId
    );
  } catch (error) {
    rollbar.error('Failed to update course', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'PATCH',
    });
    return createErrorResponse(
      'Konnte Kurs nicht aktualisieren',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Delete course (only if no enrollments)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getOrCreateRequestId(request);
  const { id } = await params;

  try {
    const { error } = await checkAdminAuth(requestId);
    if (error) return error;

    // Check for enrollments
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return createErrorResponse(
        `Course with ID ${id} does not exist`,
        'COURSE_NOT_FOUND',
        requestId,
        404
      );
    }

    if (course._count.bookings > 0) {
      rollbar.warning('Cannot delete course with active enrollments', {
        requestId,
        courseId: id,
        courseTitle: course.title,
        enrollmentCount: course._count.bookings,
        route: '/api/admin/courses/[id]',
      });

      return createErrorResponse(
        'Der Kurs kann nicht gelöscht werden, solange Teilnehmer angemeldet sind. Bitte Teilnehmer übertragen.',
        'ACTIVE_ENROLLMENTS_EXIST',
        requestId,
        409,
        {
          enrollmentCount: course._count.bookings,
          enrolledStudents: course.bookings.map(b => ({
            userId: b.user.id,
            name: b.user.name,
            enrolledAt: b.createdAt,
          })),
        }
      );
    }

    // Delete course
    await prisma.course.delete({
      where: { id },
    });

    rollbar.info('Course deleted via API', {
      requestId,
      courseId: id,
      courseTitle: course.title,
      route: '/api/admin/courses/[id]',
      method: 'DELETE',
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    rollbar.error('Failed to delete course', error as Error, {
      requestId,
      courseId: id,
      route: '/api/admin/courses/[id]',
      method: 'DELETE',
    });

    return createErrorResponse(
      'Konnte Kurs nicht löschen',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
