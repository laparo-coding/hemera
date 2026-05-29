/**
 * Domain Error Classes Tests
 * Tests for concrete error types
 */

import {
  CourseNotFoundError,
  CourseNotPublishedError,
  CourseSlugAlreadyExistsError,
  CurriculumValidationError,
  BookingNotFoundError,
  BookingAlreadyExistsError,
  InvalidBookingStatusError,
  ParticipationCreationError,
  ParticipationNotFoundError,
  UserNotFoundError,
  UserEmailAlreadyExistsError,
  PaymentProcessingError,
  StripeConfigurationError,
  UnauthorizedError,
  SessionExpiredError,
  DatabaseConnectionError,
  DatabaseConstraintError,
  DatabaseValidationError,
  FieldValidationError,
  UserValidationError,
} from '@/lib/errors/domain';

// Mock the rollbar module
vi.mock('@/lib/monitoring/rollbar-official', () => ({
  createErrorContext: vi.fn(() => ({ additionalData: {} })),
  reportError: vi.fn(),
  ErrorSeverity: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
  },
}));

describe('Domain Errors', () => {
  describe('Course Errors', () => {
    it('CourseNotFoundError should have correct properties', () => {
      const error = new CourseNotFoundError('course-123');

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('COURSE_NOT_FOUND');
      expect(error.category).toBe('business');
      expect(error.message).toContain('course-123');
      expect(error.context).toEqual({ courseId: 'course-123' });
    });

    it('CourseNotPublishedError should have correct properties', () => {
      const error = new CourseNotPublishedError('course-456');

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('COURSE_NOT_PUBLISHED');
      expect(error.category).toBe('business');
    });

    it('CourseSlugAlreadyExistsError should have correct properties', () => {
      const error = new CourseSlugAlreadyExistsError('my-course');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('COURSE_SLUG_EXISTS');
      expect(error.category).toBe('validation');
      expect(error.context).toEqual({ slug: 'my-course' });
    });
  });

  describe('Booking Errors', () => {
    it('BookingNotFoundError should have correct properties', () => {
      const error = new BookingNotFoundError('booking-123');

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('BOOKING_NOT_FOUND');
      expect(error.category).toBe('business');
    });

    it('BookingAlreadyExistsError should have correct properties', () => {
      const error = new BookingAlreadyExistsError('user-1', 'course-1');

      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('BOOKING_ALREADY_EXISTS');
      expect(error.category).toBe('business');
      expect(error.context).toEqual({ userId: 'user-1', courseId: 'course-1' });
    });

    it('InvalidBookingStatusError should have correct properties', () => {
      const error = new InvalidBookingStatusError('PENDING', 'CONFIRMED');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('INVALID_BOOKING_STATUS');
      expect(error.category).toBe('validation');
      expect(error.context).toEqual({
        currentStatus: 'PENDING',
        attemptedStatus: 'CONFIRMED',
      });
    });

    it('ParticipationNotFoundError should use the German default message', () => {
      const error = new ParticipationNotFoundError({ requestId: 'req-123' });

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('PARTICIPATION_NOT_FOUND');
      expect(error.message).toBe('Teilnahme nicht gefunden');
      expect(error.context).toEqual({ requestId: 'req-123' });
    });

    it('ParticipationNotFoundError should preserve lookup context', () => {
      const error = new ParticipationNotFoundError(
        'booking-123',
        'bookingId'
      );

      expect(error.context).toEqual({
        identifier: 'booking-123',
        lookupField: 'bookingId',
      });
    });

    it('ParticipationCreationError should use the German default message', () => {
      const error = new ParticipationCreationError({ requestId: 'req-123' });

      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe('PARTICIPATION_CREATION_FAILED');
      expect(error.message).toBe('Teilnahme konnte nicht erstellt werden');
      expect(error.context).toEqual({ requestId: 'req-123' });
    });

    it('ParticipationCreationError should preserve booking context', () => {
      const error = new ParticipationCreationError('booking-123');

      expect(error.context).toEqual({ bookingId: 'booking-123' });
    });
  });

  describe('User Errors', () => {
    it('UserNotFoundError should have correct properties', () => {
      const error = new UserNotFoundError('user-123');

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('USER_NOT_FOUND');
      expect(error.category).toBe('business');
    });

    it('UserEmailAlreadyExistsError should have correct properties', () => {
      const error = new UserEmailAlreadyExistsError('test@example.com');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('USER_EMAIL_EXISTS');
      expect(error.category).toBe('validation');
    });
  });

  describe('Payment Errors', () => {
    it('PaymentProcessingError should have correct properties', () => {
      const error = new PaymentProcessingError('Card declined', 'pi_123');

      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe('PAYMENT_PROCESSING_FAILED');
      expect(error.category).toBe('infrastructure');
      expect(error.context).toEqual({ paymentIntentId: 'pi_123' });
    });

    it('StripeConfigurationError should have correct properties', () => {
      const error = new StripeConfigurationError('STRIPE_SECRET_KEY');

      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe('STRIPE_CONFIG_ERROR');
      expect(error.category).toBe('infrastructure');
    });
  });

  describe('Auth Errors', () => {
    it('UnauthorizedError should have correct properties', () => {
      const error = new UnauthorizedError(
        'admin panel',
        'Zugriff nicht autorisiert',
        'req-123'
      );

      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
      expect(error.category).toBe('auth');
      expect(error.message).toBe('Zugriff nicht autorisiert');
      expect(error.context).toEqual({
        resource: 'admin panel',
        requestId: 'req-123',
      });
    });

    it('UnauthorizedError without resource', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Zugriff nicht autorisiert');
    });

    it('SessionExpiredError should have correct properties', () => {
      const error = new SessionExpiredError();

      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('SESSION_EXPIRED');
      expect(error.category).toBe('auth');
    });
  });

  describe('Database Errors', () => {
    it('DatabaseConnectionError should have correct properties', () => {
      const cause = new Error('Connection timeout');
      const error = new DatabaseConnectionError('findMany', cause);

      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe('DATABASE_CONNECTION_FAILED');
      expect(error.category).toBe('infrastructure');
      expect(error.cause).toBe(cause);
    });

    it('DatabaseConstraintError should have correct properties', () => {
      const error = new DatabaseConstraintError('unique_email', 'users');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('DATABASE_CONSTRAINT_VIOLATION');
      expect(error.category).toBe('validation');
      expect(error.context).toEqual({
        constraint: 'unique_email',
        table: 'users',
      });
    });

    it('DatabaseValidationError should have correct properties', () => {
      const error = new DatabaseValidationError('Invalid foreign key');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('DATABASE_VALIDATION_FAILED');
      expect(error.category).toBe('validation');
    });
  });

  describe('Validation Errors', () => {
    it('FieldValidationError should have correct properties', () => {
      const error = new FieldValidationError('email', 'Invalid format');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('FIELD_VALIDATION_ERROR');
      expect(error.category).toBe('validation');
      expect(error.context).toEqual({ field: 'email', reason: 'Invalid format' });
    });

    it('UserValidationError should have correct properties', () => {
      const error = new UserValidationError('Missing required fields');

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('USER_VALIDATION_ERROR');
      expect(error.category).toBe('validation');
    });

    it('CurriculumValidationError should have correct properties', () => {
      const error = new CurriculumValidationError(3);

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('CURRICULUM_VALIDATION_ERROR');
      expect(error.category).toBe('validation');
      expect(error.context).toEqual({ invalidFieldCount: 3 });
    });

    it('CurriculumValidationError without fieldCount should work', () => {
      const error = new CurriculumValidationError();

      expect(error.statusCode).toBe(422);
      expect(error.errorCode).toBe('CURRICULUM_VALIDATION_ERROR');
      expect(error.message).toContain('Invalid curriculum structure');
    });
  });

  describe('Error Serialization', () => {
    it('toJSON should include all properties', () => {
      const error = new CourseNotFoundError('course-123');
      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'CourseNotFoundError',
        message: expect.stringContaining('course-123'),
        statusCode: 404,
        errorCode: 'COURSE_NOT_FOUND',
        category: 'business',
        context: { courseId: 'course-123' },
      });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });
});
