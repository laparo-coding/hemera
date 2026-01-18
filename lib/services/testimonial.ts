/**
 * Testimonial Service
 * Feature: 017-testimonial-management
 *
 * Service for managing course testimonials/reviews.
 * Note: This is a stub implementation until the Testimonial model is added to the schema.
 */

export interface Testimonial {
  id: string;
  courseId: string;
  userId?: string; // DB user ID for entity relationships
  authorName: string;
  authorRole?: string;
  authorImage?: string;
  content: string;
  rating: number;
  isPublished: boolean;
  createdAt: Date;
}

/**
 * Get published testimonials for a specific course
 *
 * @param courseId - The course ID to fetch testimonials for
 * @param limit - Maximum number of testimonials to return (default: 10)
 * @returns Array of published testimonials
 *
 * TODO: Replace with actual Prisma query once Testimonial model is added to schema
 */
export async function getPublishedTestimonialsForCourse(
  courseId: string,
  limit = 10
): Promise<Testimonial[]> {
  // Stub implementation - returns empty array until Testimonial model exists
  // This prevents compilation errors while the feature is being developed
  console.log(
    `[Testimonial Service] Fetching testimonials for course ${courseId} (limit: ${limit})`
  );

  // TODO: Implement with Prisma once model is added:
  // return prisma.testimonial.findMany({
  //   where: {
  //     courseId,
  //     isPublished: true,
  //   },
  //   orderBy: { createdAt: 'desc' },
  //   take: limit,
  // });

  return [];
}

/**
 * Get all testimonials for a course (admin view)
 *
 * @param courseId - The course ID
 * @returns Array of all testimonials (published and unpublished)
 */
export async function getAllTestimonialsForCourse(
  courseId: string
): Promise<Testimonial[]> {
  console.log(
    `[Testimonial Service] Fetching all testimonials for course ${courseId}`
  );
  return [];
}

/**
 * Create a new testimonial
 *
 * @param data - Testimonial data
 * @returns Created testimonial
 */
export async function createTestimonial(
  data: Omit<Testimonial, 'id' | 'createdAt'>
): Promise<Testimonial> {
  console.log('[Testimonial Service] Creating testimonial', data);
  throw new Error('Testimonial creation not yet implemented');
}

/**
 * Update testimonial publish status
 *
 * @param testimonialId - The testimonial ID
 * @param isPublished - New publish status
 * @returns Updated testimonial
 */
export async function updateTestimonialStatus(
  testimonialId: string,
  isPublished: boolean
): Promise<Testimonial> {
  console.log(
    `[Testimonial Service] Updating testimonial ${testimonialId} status to ${isPublished}`
  );
  throw new Error('Testimonial status update not yet implemented');
}
