/**
 * Standardized API response utilities
 */

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	meta?: {
		requestId: string;
		timestamp: string;
		version?: string;
	};
}

/**
 * Create an error API response
 */
export function createErrorResponse(
	message: string,
	code: string,
	requestId?: string,
	httpStatus?: number,
	details?: Record<string, unknown>,
): Response {
	const errorResponse: ApiResponse<never> = {
		success: false,
		error: {
			code,
			message,
			details,
		},
		meta: {
			requestId: requestId || "unknown",
			timestamp: new Date().toISOString(),
			version: "1.0",
		},
	};

	return Response.json(errorResponse, {
		status: httpStatus || 500,
		headers: {
			"Content-Type": "application/json",
			...(requestId && { "X-Request-ID": requestId }),
		},
	});
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
	data: T,
	requestId?: string,
	httpStatus?: number,
): Response {
	const successResponse: ApiResponse<T> = {
		success: true,
		data,
		meta: {
			requestId: requestId || "unknown",
			timestamp: new Date().toISOString(),
			version: "1.0",
		},
	};

	return Response.json(successResponse, {
		status: httpStatus || 200,
		headers: {
			"Content-Type": "application/json",
			...(requestId && { "X-Request-ID": requestId }),
		},
	});
}

/**
 * Common error codes
 */
export const ErrorCodes = {
	// Authentication & Authorization
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	INVALID_TOKEN: "INVALID_TOKEN",

	// Validation
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_INPUT: "INVALID_INPUT",
	MISSING_FIELD: "MISSING_FIELD",

	// Resource
	NOT_FOUND: "NOT_FOUND",
	ALREADY_EXISTS: "ALREADY_EXISTS",
	CONFLICT: "CONFLICT",

	// Server
	INTERNAL_ERROR: "INTERNAL_ERROR",
	DATABASE_ERROR: "DATABASE_ERROR",
	EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

	// Rate Limiting
	RATE_LIMITED: "RATE_LIMITED",
	TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

	// Business Logic
	INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
	COURSE_FULL: "COURSE_FULL",
	BOOKING_FAILED: "BOOKING_FAILED",
	PAYMENT_FAILED: "PAYMENT_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
