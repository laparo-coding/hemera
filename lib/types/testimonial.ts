/**
 * Testimonial Types - Shared types for Testimonial API consumption
 * Feature: 017-testimonial-management
 *
 * These types ensure compile-time safety when consuming API responses.
 * They are derived from Prisma types and Zod schemas for consistency.
 */

import type { Testimonial } from '@prisma/client';
import type {
  NameDisplayFormat,
  TestimonialStatus,
} from '@/lib/schemas/testimonial-schema';

// Re-export schema types for convenience
export type {
  NameDisplayFormat,
  TestimonialStatus,
} from '@/lib/schemas/testimonial-schema';

/**
 * Course summary included with testimonials
 */
export interface TestimonialCourse {
  id: string;
  title: string;
  slug: string;
}

/**
 * Testimonial with course relation
 * Used in admin list and user dashboard
 */
export interface TestimonialWithCourse extends Testimonial {
  course: TestimonialCourse;
}

/**
 * Serialized testimonial for JSON API responses
 * Date fields are converted to ISO strings
 */
export interface TestimonialApiResponse {
  id: string;
  bookingId: string;
  courseId: string;
  statement: string;
  nameDisplayFormat: NameDisplayFormat;
  cachedDisplayName: string;
  cachedPhotoUrl: string | null;
  cachedCity: string | null;
  status: TestimonialStatus;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Serialized testimonial with course for JSON API responses
 */
export interface TestimonialWithCourseApiResponse
  extends TestimonialApiResponse {
  course: TestimonialCourse;
}

/**
 * Admin testimonials list API response
 * GET /api/admin/testimonials
 */
export interface AdminTestimonialsListResponse {
  testimonials: TestimonialWithCourseApiResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Standard API success wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

/**
 * Standard API error wrapper
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
  requestId: string;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Typed fetch helper for admin testimonials list
 */
export type AdminTestimonialsApiResponse =
  ApiSuccessResponse<AdminTestimonialsListResponse>;

/**
 * Typed fetch helper for single testimonial update
 */
export type AdminTestimonialUpdateApiResponse =
  ApiSuccessResponse<TestimonialApiResponse>;

/**
 * Helper to convert Prisma Testimonial to API response format
 */
export function toTestimonialApiResponse(
  testimonial: Testimonial
): TestimonialApiResponse {
  return {
    id: testimonial.id,
    bookingId: testimonial.bookingId,
    courseId: testimonial.courseId,
    statement: testimonial.statement,
    nameDisplayFormat: testimonial.nameDisplayFormat,
    cachedDisplayName: testimonial.cachedDisplayName,
    cachedPhotoUrl: testimonial.cachedPhotoUrl,
    cachedCity: testimonial.cachedCity,
    status: testimonial.status,
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}

/**
 * Helper to convert Prisma TestimonialWithCourse to API response format
 */
export function toTestimonialWithCourseApiResponse(
  testimonial: TestimonialWithCourse
): TestimonialWithCourseApiResponse {
  return {
    ...toTestimonialApiResponse(testimonial),
    course: testimonial.course,
  };
}

/**
 * User testimonials list API response
 * GET /api/testimonials
 */
export type UserTestimonialsListApiResponse = ApiSuccessResponse<
  TestimonialWithCourseApiResponse[]
>;

/**
 * User testimonial create/update API response
 * POST/PATCH /api/testimonials
 */
export type UserTestimonialApiResponse =
  ApiSuccessResponse<TestimonialApiResponse>;
