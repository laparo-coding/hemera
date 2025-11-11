/**
 * Centralized Error Module
 * Export all error types and utilities from a single entry point
 */

// Base error classes
export {
	AuthError,
	BaseError,
	BusinessError,
	InfrastructureError,
	ValidationError,
} from "./base";

// Domain-specific errors
export {
	BookingAlreadyExistsError,
	BookingNotFoundError,
	CourseNotFoundError,
	CourseNotPublishedError,
	CourseSlugAlreadyExistsError,
	DatabaseConnectionError,
	DatabaseConstraintError,
	DatabaseValidationError,
	FieldValidationError,
	InvalidBookingStatusError,
	PaymentProcessingError,
	SessionExpiredError,
	StripeConfigurationError,
	UnauthorizedError,
	UserEmailAlreadyExistsError,
	UserNotFoundError,
	UserValidationError,
} from "./domain";

// HTTP utilities
export {
	type ApiErrorResponse,
	logError,
	toHttpError,
	withErrorHandling,
} from "./http";
