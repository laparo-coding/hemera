import type { Course } from '@prisma/client';

/**
 * Course Level (will be Prisma enum after migration)
 */
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Course with enrollment count
 * Used in list and detail views to show how many students are enrolled
 * Note: We use bookings as a proxy for enrollments in the current schema
 */
export type CourseWithEnrollmentCount = Course & {
  _count: {
    bookings: number;
  };
};

/**
 * DTO for creating a new course
 * Omits auto-generated fields
 */
export type CourseCreateInput = {
  title: string;
  description: string;
  price: number;
  startDate: Date;
  startTime: Date;
  endTime: Date;
  instructor: string;
  level: CourseLevel;
  thumbnailUrl?: string | null;
  capacity: number;
};

/**
 * DTO for updating an existing course
 * All fields optional except updatedAt (for optimistic locking)
 */
export type CourseUpdateInput = {
  title?: string;
  description?: string;
  price?: number;
  startDate?: Date;
  startTime?: Date;
  endTime?: Date;
  instructor?: string;
  level?: CourseLevel;
  thumbnailUrl?: string | null;
  capacity?: number;
  updatedAt: Date; // Required for optimistic locking
};

/**
 * DTO for transferring enrollments
 */
export type EnrollmentTransferInput = {
  targetCourseId: string;
};

/**
 * Admin operation result
 */
export type AdminOperationResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code: string;
    };
