/**
 * Demo API Route for Error Testing
 * Allows testing different error types in development
 */

import { type NextRequest, NextResponse } from "next/server";
import {
	CourseNotFoundError,
	DatabaseConnectionError,
	PaymentProcessingError,
	StripeConfigurationError,
	UnauthorizedError,
	withErrorHandling,
} from "@/lib/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
	const { searchParams } = new URL(request.url);
	const errorType = searchParams.get("type");

	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json(
			{ error: "Demo endpoints only available in development" },
			{ status: 403 },
		);
	}

	switch (errorType) {
		case "course-not-found":
			throw new CourseNotFoundError("demo-course-123");

		case "payment-error":
			throw new PaymentProcessingError("Demo payment failure for testing");

		case "database-error":
			throw new DatabaseConnectionError("demo database operation");

		case "auth-error":
			throw new UnauthorizedError("demo protected resource");

		case "config-error":
			throw new StripeConfigurationError("DEMO_CONFIG_KEY");

		case "standard-error":
			throw new Error("This is a standard JavaScript error for testing");

		case "unknown-error":
			throw "This is an unknown error type for testing";

		default:
			return NextResponse.json({
				message: "Error Demo API",
				availableTypes: [
					"course-not-found",
					"payment-error",
					"database-error",
					"auth-error",
					"config-error",
					"standard-error",
					"unknown-error",
				],
				usage: "/api/demo/errors?type=course-not-found",
			});
	}
});
