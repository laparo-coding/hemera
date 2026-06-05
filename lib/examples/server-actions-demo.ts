/**
 * Example Server Actions using new error handling middleware
 * Demonstrates comprehensive error handling patterns for Server Actions
 */

'use server';

import { createBooking } from '../api/bookings';
import { BookingAlreadyExistsError } from '../errors/domain';
import {
  createFormAction,
  type ServerActionContext,
  withAuthenticatedServerAction,
  withFormValidation,
  withOptimisticUpdate,
  withRetry,
  withServerActionErrorHandling,
  withTransaction,
} from '../middleware/server-action-error-handling';

// Example 1: Basic server action with error handling
export const createCourseAction = withServerActionErrorHandling(
  async (_context: ServerActionContext) => {
    // Simulate course creation
    const course = {
      id: 'course-1',
      title: 'New Course',
      description: 'Course description',
      createdAt: new Date(),
    };

    return course;
  }
);

// Example 2: Authenticated server action
export const updateProfileAction = withAuthenticatedServerAction(
  async context => {
    const { userId } = context;

    // Update user profile
    // Implementation would go here

    return {
      userId,
      message: 'Profile updated successfully',
    };
  }
);

// Example 3: Form validation server action
const bookingSchema = {
  parse: (data: unknown): Record<string, unknown> => {
    const record = data as Record<string, unknown>;
    if (!record.courseId || !record.userId || !record.date) {
      throw new Error('Course ID, User ID, and date are required');
    }
    return data as Record<string, unknown>;
  },
};

export const createBookingAction = withFormValidation(
  bookingSchema,
  async (
    _context: ServerActionContext,
    validatedData: Record<string, unknown>
  ) => {
    const data = validatedData as {
      courseId: string;
      userId: string;
      date: string;
    };
    const booking = await createBooking({
      courseId: data.courseId,
      userId: data.userId,
      paymentStatus: 'PENDING',
    });

    return booking;
  }
);

// Example 4: Optimistic update server action
export const toggleBookmarkAction = withOptimisticUpdate(
  async (_context: ServerActionContext) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Toggle bookmark logic - 50% chance to be bookmarked
    const isBookmarked = Math.random() > 0.5;

    return { isBookmarked };
  },
  { isBookmarked: true } // Optimistic value
);

// Example 5: Server action with retry logic
export const syncExternalDataAction = withRetry(
  async (_context: ServerActionContext) => {
    // Simulate external API call that might fail (~30% failure rate)
    if (Math.random() < 0.3) {
      throw new Error('External API temporarily unavailable');
    }

    return { synced: true, timestamp: new Date() };
  },
  3, // Max retries
  1000 // Retry delay in ms
);

// Example 6: Transaction-based server action
export const transferCreditsAction = withTransaction(async context => {
  const { tx: _tx, userId } = context;

  // Simulate credit transfer within transaction
  // Implementation would use actual Prisma transaction

  return {
    fromUser: userId,
    toUser: 'target-user-id',
    amount: 100,
    transactionId: context.requestId,
  };
});

// Example 7: File upload action
export const uploadCourseImageAction = createFormAction(
  async (formData: FormData, context: ServerActionContext) => {
    const file = formData.get('image') as File;

    if (!file) {
      throw new Error('No image file provided');
    }

    // Simulate file upload
    const uploadResult = {
      filename: file.name,
      size: file.size,
      type: file.type,
      url: `https://cdn.example.com/${context.requestId}/${file.name}`,
    };

    return uploadResult;
  }
);

// Example 8: Complex server action with error boundaries
export const enrollInCourseAction = withAuthenticatedServerAction(
  async context => {
    const { userId, requestId: _requestId } = context;
    // Check if user is already enrolled
    const existingEnrollment = await checkExistingEnrollment(
      userId,
      'course-id'
    );

    if (existingEnrollment) {
      throw new BookingAlreadyExistsError(userId, 'course-id');
    }

    // Create enrollment
    const enrollment = await createEnrollment(userId, 'course-id');

    // Send welcome email (fire and forget)
    sendWelcomeEmail(userId, 'course-id').catch(_error => {
      /* Intentionally swallow errors for fire-and-forget email */
    });

    return enrollment;
  }
);

// Helper functions (placeholders)
async function checkExistingEnrollment(_userId: string, _courseId: string) {
  return null; // Placeholder
}

async function createEnrollment(userId: string, courseId: string) {
  return {
    id: 'enrollment-id',
    userId,
    courseId,
    enrolledAt: new Date(),
  };
}

async function sendWelcomeEmail(_userId: string, _courseId: string) {
  // Email sending logic
  return true;
}
