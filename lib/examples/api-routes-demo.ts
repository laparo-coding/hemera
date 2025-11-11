/**
 * Example API Route using new error handling middleware
 * Demonstrates comprehensive error handling patterns
 */

import { NextResponse } from 'next/server';
import { getCourseById } from '@/lib/api/courses';
import { CourseNotFoundError } from '@/lib/errors/domain';
import {
  type ApiRouteContext,
  withApiErrorHandling,
  withAuthProtection,
  withRequestValidation,
} from '@/lib/middleware/api-error-handling';

// Example 1: Basic API route with error handling
export const GET = withApiErrorHandling(async (context: ApiRouteContext) => {
  const courseId = context.params?.id;

  if (!courseId) {
    throw new CourseNotFoundError(courseId || 'unknown');
  }

  const course = await getCourseById(courseId);

  return NextResponse.json({ course });
});

// Example 2: Protected API route with authentication
export const POST = withAuthProtection(async context => {
  const { userId } = context;

  // Only authenticated users can create courses
  // Implementation would go here

  return NextResponse.json({
    message: 'Course created successfully',
    userId,
  });
});

// Example 3: API route with request validation
const createCourseSchema = {
  parse: (data: unknown) => {
    const record = data as Record<string, unknown>;
    if (!record.title || !record.description) {
      throw new Error('Title and description are required');
    }
    return data;
  },
};

export const PUT = withRequestValidation(
  createCourseSchema, // body schema
  undefined // query schema
)(async context => {
  const { validatedBody } = context;

  // Create course with validated data
  // Implementation would go here

  return NextResponse.json({
    message: 'Course updated successfully',
    data: validatedBody,
  });
});

// Example 4: API route with rate limiting and CORS
export const PATCH = withApiErrorHandling(async _context => {
  // Rate limiting and CORS would be applied here
  // For demonstration purposes, simplified implementation
  return NextResponse.json({ message: 'Course patched successfully' });
});

// Example 5: Complex API route with multiple middleware layers
export const DELETE = withAuthProtection(async context => {
  const courseId = context.params?.id;
  const { userId } = context;

  if (!courseId) {
    throw new CourseNotFoundError(courseId || 'unknown');
  }

  // Check if user owns the course or is admin
  // Implementation would go here

  return NextResponse.json({
    message: 'Course deleted successfully',
    courseId,
    deletedBy: userId,
  });
});
