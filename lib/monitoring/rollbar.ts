/**
 * Rollbar Configuration for Production Error Monitoring
 * Provides comprehensive error tracking, user context, and performance monitoring
 */

import Rollbar from "rollbar";

// Environment-specific configuration
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Rollbar configuration
export const rollbarConfig: Rollbar.Configuration = {
	accessToken: process.env.ROLLBAR_SERVER_ACCESS_TOKEN,
	environment: process.env.NODE_ENV || "development",

	// Capture uncaught exceptions and unhandled rejections
	captureUncaught: isProduction,
	captureUnhandledRejections: isProduction,

	// Code version for release tracking
	codeVersion:
		process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

	// Server configuration (commented out - not part of Configuration interface)
	// server: {
	//   root: process.cwd(),
	//   branch: process.env.VERCEL_GIT_COMMIT_REF || 'main',
	// },

	// Transform function to add custom data
	transform: (payload: Record<string, unknown>) => {
		// Add deployment info
		if (process.env.VERCEL_URL) {
			payload.server = {
				...(payload.server || {}),
				host: process.env.VERCEL_URL,
				deployment_id: process.env.VERCEL_DEPLOYMENT_ID,
			};
		}

		// Add custom metadata
		payload.custom = {
			...(payload.custom || {}),
			buildId: process.env.NEXT_BUILD_ID,
			region: process.env.VERCEL_REGION,
			runtime: "nextjs",
		};
	},

	// Item filtering
	// filterTelemetry: isDevelopment, // Disable telemetry in dev
	enabled: isProduction || process.env.ROLLBAR_ENABLED === "true",

	// Rate limiting
	maxItems: 1000, // Max items per minute
	itemsPerMinute: 60,

	// Ignore certain errors
	ignoredMessages: [
		"Script error.",
		"Network request failed",
		"Load failed",
		"Non-Error promise rejection captured",
	],

	// Custom fingerprinting for better error grouping (commented out - not in Configuration)
	// fingerprint: (payload) => {
	//   const { body } = payload;
	//   if (body.trace?.exception?.class && body.trace?.exception?.message) {
	//     return `${body.trace.exception.class}:${body.trace.exception.message}`;
	//   }
	//   return undefined;
	// },

	// Verbose logging in development
	verbose: isDevelopment,
	reportLevel: isDevelopment ? "debug" : "warning",
};

// Initialize Rollbar instance
export const rollbar = new Rollbar(rollbarConfig);

// Error severity levels
export const ErrorSeverity = {
	CRITICAL: "critical",
	ERROR: "error",
	WARNING: "warning",
	INFO: "info",
	DEBUG: "debug",
} as const;

export type ErrorSeverityType =
	(typeof ErrorSeverity)[keyof typeof ErrorSeverity];

/**
 * Enhanced error reporting with context
 */
export interface ErrorContext {
	userId?: string;
	userEmail?: string;
	requestId?: string;
	route?: string;
	method?: string;
	userAgent?: string;
	ip?: string;
	timestamp?: Date;
	additionalData?: Record<string, unknown>;
}

/**
 * Report error to Rollbar with enhanced context
 */
export function reportError(
	error: Error | string,
	context?: ErrorContext,
	severity: ErrorSeverityType = ErrorSeverity.ERROR,
): void {
	if (!rollbarConfig.enabled) {
		// Rollbar Error (disabled)
		return;
	}

	try {
		const rollbarContext = {
			person: context?.userId
				? {
						id: context.userId,
						email: context.userEmail,
					}
				: undefined,

			request: {
				id: context?.requestId,
				url: context?.route,
				method: context?.method,
				user_ip: context?.ip,
				headers: {
					"User-Agent": context?.userAgent,
				},
			},

			custom: {
				timestamp: context?.timestamp?.toISOString(),
				...context?.additionalData,
			},
		};

		// Report based on severity
		switch (severity) {
			case ErrorSeverity.CRITICAL:
				rollbar.critical(error, rollbarContext);
				break;
			case ErrorSeverity.ERROR:
				rollbar.error(error, rollbarContext);
				break;
			case ErrorSeverity.WARNING:
				rollbar.warning(error, rollbarContext);
				break;
			case ErrorSeverity.INFO:
				rollbar.info(error, rollbarContext);
				break;
			case ErrorSeverity.DEBUG:
				rollbar.debug(error, rollbarContext);
				break;
			default:
				rollbar.error(error, rollbarContext);
		}
	} catch (_rollbarError) {
		// Failed to report error to Rollbar - fallback logging disabled
	}
}

/**
 * Report performance issues
 */
export function reportPerformanceIssue(
	operation: string,
	duration: number,
	threshold: number = 1000,
	context?: ErrorContext,
): void {
	if (duration > threshold) {
		reportError(
			`Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
			{
				...context,
				additionalData: {
					operation,
					duration,
					threshold,
					performanceIssue: true,
				},
			},
			ErrorSeverity.WARNING,
		);
	}
}

/**
 * Report business logic violations
 */
export function reportBusinessError(
	errorCode: string,
	message: string,
	context?: ErrorContext,
): void {
	reportError(
		`Business Error [${errorCode}]: ${message}`,
		{
			...context,
			additionalData: {
				errorCode,
				businessLogicError: true,
				...context?.additionalData,
			},
		},
		ErrorSeverity.WARNING,
	);
}

/**
 * Report security incidents
 */
export function reportSecurityIncident(
	incident: string,
	context?: ErrorContext,
): void {
	reportError(
		`Security Incident: ${incident}`,
		{
			...context,
			additionalData: {
				securityIncident: true,
				incident,
				...context?.additionalData,
			},
		},
		ErrorSeverity.CRITICAL,
	);
}

/**
 * Create error context from Next.js request
 */
export function createErrorContext(
	request?: Request,
	userId?: string,
	requestId?: string,
): ErrorContext {
	return {
		userId,
		requestId,
		route: request ? new URL(request.url).pathname : undefined,
		method: request?.method,
		userAgent: request?.headers.get("user-agent") || undefined,
		ip:
			request?.headers.get("x-forwarded-for") ||
			request?.headers.get("x-real-ip") ||
			undefined,
		timestamp: new Date(),
	};
}

/**
 * Rollbar telemetry for user actions
 */
export function recordUserAction(
	action: string,
	userId?: string,
	metadata?: Record<string, unknown>,
): void {
	if (!rollbarConfig.enabled) return;

	try {
		rollbar.info(`User Action: ${action}`, {
			person: userId ? { id: userId } : undefined,
			custom: {
				action,
				userAction: true,
				timestamp: new Date().toISOString(),
				...metadata,
			},
		});
	} catch (_error) {
		// Failed to record user action - error suppressed for production
	}
}

/**
 * Flush Rollbar queue (useful for serverless)
 */
export function flushRollbar(): Promise<void> {
	return new Promise((resolve) => {
		if (!rollbarConfig.enabled) {
			resolve();
			return;
		}

		rollbar.wait(() => {
			resolve();
		});
	});
}

// Environment validation
if (isProduction && !process.env.ROLLBAR_SERVER_ACCESS_TOKEN) {
	// ROLLBAR_SERVER_ACCESS_TOKEN not set in production environment
}
