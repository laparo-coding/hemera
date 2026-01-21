/**
 * Testimonial Types
 * Feature: 017-testimonial-management
 *
 * TypeScript types for testimonial API responses.
 */

/**
 * Base testimonial type matching Prisma model
 */
export interface Testimonial {
  id: string;
  courseId: string;
  userId: string | null;
  authorName: string;
  authorRole: string | null;
  authorImage: string | null;
  content: string;
  rating: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Testimonial with course info for admin views
 */
export interface TestimonialWithCourse extends Testimonial {
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * API response type with serialized dates
 */
export interface TestimonialApiResponse {
  id: string;
  courseId: string;
  userId: string | null;
  authorName: string;
  authorRole: string | null;
  authorImage: string | null;
  content: string;
  rating: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response with course info
 */
export interface TestimonialWithCourseApiResponse
  extends TestimonialApiResponse {
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Admin testimonials list response
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
 * Transform testimonial to API response (serialize dates)
 */
export function toTestimonialApiResponse(
  testimonial: Testimonial
): TestimonialApiResponse {
  return {
    ...testimonial,
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}

/**
 * Transform testimonial with course to API response
 */
export function toTestimonialWithCourseApiResponse(
  testimonial: TestimonialWithCourse
): TestimonialWithCourseApiResponse {
  return {
    ...toTestimonialApiResponse(testimonial),
    course: testimonial.course,
  };
}
