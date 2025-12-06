import { PaymentStatus } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { type CourseWithBookings, getCourses } from '@/lib/services/courses';
import { createApiLogger } from '@/lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Schema für Query-Parameter
const CourseSearchSchema = z.object({
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  availableOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(['title', 'price', 'date']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'GET', '/api/courses');
  const logger = createApiLogger(context);

  try {
    logger.info('Starting public course list request');

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedParams;
    try {
      validatedParams = CourseSearchSchema.parse(queryParams);
    } catch (error) {
      logger.warn('Invalid query parameters', { queryParams, error });
      return createErrorResponse(
        'Ungültige Query-Parameter',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    logger.info('Fetching courses', { params: validatedParams });

    // Kurse von der Mock-Funktion abrufen
    const courses = await getCourses();

    let filteredCourses = courses;

    // Suchfilter anwenden
    if (validatedParams.search) {
      const searchTerm = validatedParams.search.toLowerCase();
      filteredCourses = filteredCourses.filter(
        (course: CourseWithBookings) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Preisfilter anwenden
    if (validatedParams.minPrice !== undefined) {
      const minPrice = validatedParams.minPrice;
      filteredCourses = filteredCourses.filter(
        (course: CourseWithBookings) => (course.price || 0) >= minPrice
      );
    }

    if (validatedParams.maxPrice !== undefined) {
      const maxPrice = validatedParams.maxPrice;
      filteredCourses = filteredCourses.filter(
        (course: CourseWithBookings) => (course.price || 0) <= maxPrice
      );
    }

    // Verfügbarkeitsfilter anwenden
    if (validatedParams.availableOnly) {
      filteredCourses = filteredCourses.filter((course: CourseWithBookings) => {
        if (!course.capacity) return true; // Unlimited capacity
        const paidBookings =
          course.bookings?.filter(
            booking =>
              booking.paymentStatus === PaymentStatus.PAID ||
              booking.paymentStatus === PaymentStatus.PENDING
          ) || [];
        return paidBookings.length < course.capacity;
      });
    }

    // Sortierung anwenden
    if (validatedParams.sortBy) {
      filteredCourses.sort((a: CourseWithBookings, b: CourseWithBookings) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (validatedParams.sortBy) {
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'date':
            aValue = a.date || new Date(0);
            bValue = b.date || new Date(0);
            break;
          default:
            aValue = a.title;
            bValue = b.title;
        }

        if (aValue < bValue)
          return validatedParams.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue)
          return validatedParams.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Paginierung anwenden
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

    // Response-Format
    const response = {
      courses: paginatedCourses.map((course: CourseWithBookings) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        slug: course.slug,
        price: course.price,
        currency: course.currency,
        capacity: course.capacity,
        date: course.date,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        // Berechne verfügbare Plätze
        availableSpots: course.capacity
          ? Math.max(
              0,
              course.capacity -
                (course.bookings?.filter(
                  booking =>
                    booking.paymentStatus === PaymentStatus.PAID ||
                    booking.paymentStatus === PaymentStatus.PENDING
                ).length || 0)
            )
          : null,
        totalBookings:
          course.bookings?.filter(
            booking =>
              booking.paymentStatus === PaymentStatus.PAID ||
              booking.paymentStatus === PaymentStatus.PENDING
          ).length || 0,
        // User-spezifische Informationen
        userBookingStatus: null, // Mock-Implementation
      })),
      pagination: {
        page,
        limit,
        total: filteredCourses.length,
        totalPages: Math.ceil(filteredCourses.length / limit),
        hasNext: endIndex < filteredCourses.length,
        hasPrev: startIndex > 0,
      },
    };

    logger.info('Course list request completed successfully', {
      courseCount: paginatedCourses.length,
      totalResults: filteredCourses.length,
    });

    return createSuccessResponse(response, requestId);
  } catch (error) {
    logger.error('Error in GET /api/courses', error as Error);
    return createErrorResponse(
      'Interner Serverfehler beim Abrufen der Kurse',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
