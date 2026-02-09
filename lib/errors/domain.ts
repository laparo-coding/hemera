/**
 * Domain-Specific Error Classes
 * Concrete error types for business logic violations
 */

import {
  AuthError,
  BusinessError,
  InfrastructureError,
  ValidationError,
} from './base';

// ===== COURSE ERRORS =====
export class CourseNotFoundError extends BusinessError {
  readonly errorCode = 'COURSE_NOT_FOUND';
  // Override to 404 - "Not Found" is not a business error, it's a normal HTTP response
  override readonly statusCode = 404;

  constructor(courseId: string) {
    super(`Course with ID ${courseId} not found`, { courseId });
  }
}

export class CourseNotPublishedError extends BusinessError {
  readonly errorCode = 'COURSE_NOT_PUBLISHED';
  // Override to 404 - unpublished courses are effectively "not found" for users
  override readonly statusCode = 404;

  constructor(courseId: string) {
    super(`Course ${courseId} is not published`, { courseId });
  }
}

export class CourseSlugAlreadyExistsError extends ValidationError {
  readonly errorCode = 'COURSE_SLUG_EXISTS';

  constructor(slug: string) {
    super(`Course with slug '${slug}' already exists`, { slug });
  }
}

export class CurriculumValidationError extends ValidationError {
  readonly errorCode = 'CURRICULUM_VALIDATION_ERROR';

  constructor(fieldCount?: number) {
    super(
      'Invalid curriculum structure. Expected an array of curriculum items.',
      fieldCount !== undefined ? { invalidFieldCount: fieldCount } : undefined
    );
  }
}

// ===== BOOKING ERRORS =====
export class BookingNotFoundError extends BusinessError {
  readonly errorCode = 'BOOKING_NOT_FOUND';
  // Override to 404 - "Not Found" is a normal HTTP response
  override readonly statusCode = 404;

  constructor(bookingId: string) {
    super(`Booking with ID ${bookingId} not found`, { bookingId });
  }
}

export class BookingAlreadyExistsError extends BusinessError {
  readonly errorCode = 'BOOKING_ALREADY_EXISTS';

  constructor(userId: string, courseId: string) {
    super(`User ${userId} already has a booking for course ${courseId}`, {
      userId,
      courseId,
    });
  }
}

export class InvalidBookingStatusError extends ValidationError {
  readonly errorCode = 'INVALID_BOOKING_STATUS';

  constructor(currentStatus: string, attemptedStatus: string) {
    super(
      `Cannot change booking status from ${currentStatus} to ${attemptedStatus}`,
      {
        currentStatus,
        attemptedStatus,
      }
    );
  }
}

// ===== USER ERRORS =====
export class UserNotFoundError extends BusinessError {
  readonly errorCode = 'USER_NOT_FOUND';
  // Override to 404 - "Not Found" is a normal HTTP response
  override readonly statusCode = 404;

  constructor(userId: string) {
    super(`User with ID ${userId} not found`, { userId });
  }
}

export class UserEmailAlreadyExistsError extends ValidationError {
  readonly errorCode = 'USER_EMAIL_EXISTS';

  constructor(email: string) {
    super(`User with email '${email}' already exists`, { email });
  }
}

// ===== PAYMENT ERRORS =====
export class PaymentProcessingError extends InfrastructureError {
  readonly errorCode = 'PAYMENT_PROCESSING_FAILED';

  constructor(reason: string, paymentIntentId?: string) {
    super(`Payment processing failed: ${reason}`, { paymentIntentId });
  }
}

export class StripeConfigurationError extends InfrastructureError {
  readonly errorCode = 'STRIPE_CONFIG_ERROR';

  constructor(missingConfig: string) {
    super(
      `Stripe configuration error: ${missingConfig} is missing or invalid`,
      { missingConfig }
    );
  }
}

// ===== AUTH ERRORS =====
export class UnauthorizedError extends AuthError {
  readonly errorCode = 'UNAUTHORIZED';

  constructor(resource?: string) {
    super(
      resource ? `Unauthorized access to ${resource}` : 'Unauthorized access'
    );
  }
}

export class SessionExpiredError extends AuthError {
  readonly errorCode = 'SESSION_EXPIRED';

  constructor() {
    super('Session has expired, please sign in again');
  }
}

// ===== DATABASE ERRORS =====
export class DatabaseConnectionError extends InfrastructureError {
  readonly errorCode = 'DATABASE_CONNECTION_FAILED';

  constructor(operation: string, cause?: Error) {
    super(`Database operation failed: ${operation}`, { operation }, cause);
  }
}

export class DatabaseConstraintError extends ValidationError {
  readonly errorCode = 'DATABASE_CONSTRAINT_VIOLATION';

  constructor(constraint: string, table: string) {
    super(`Database constraint violation: ${constraint} in table ${table}`, {
      constraint,
      table,
    });
  }
}

// ===== VALIDATION SPECIFIC ERRORS =====
export class DatabaseValidationError extends ValidationError {
  readonly errorCode = 'DATABASE_VALIDATION_FAILED';

  constructor(message: string) {
    super(`Database validation failed: ${message}`);
  }
}

export class FieldValidationError extends ValidationError {
  readonly errorCode = 'FIELD_VALIDATION_ERROR';

  constructor(field: string, reason: string) {
    super(`Field validation error: ${field} - ${reason}`, { field, reason });
  }
}

export class UserValidationError extends ValidationError {
  readonly errorCode = 'USER_VALIDATION_ERROR';

  constructor(message: string) {
    super(`User validation error: ${message}`);
  }
}

export class UnexpectedDatabaseError extends InfrastructureError {
  readonly errorCode = 'UNEXPECTED_DATABASE_ERROR';

  constructor(operation: string, cause?: Error) {
    super(
      `Unexpected database error during: ${operation}`,
      { operation },
      cause
    );
  }
}
