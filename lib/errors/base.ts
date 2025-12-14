/**
 * Base Error Classes for Hemera Application
 * Provides structured error handling with proper categorization
 */

import {
  createErrorContext,
  ErrorSeverity,
  type ErrorSeverityType,
  reportError,
} from '../monitoring/rollbar-official';

export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly category:
    | 'business'
    | 'infrastructure'
    | 'validation'
    | 'auth';

  public readonly timestamp: Date;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Report to Rollbar
    this.reportToRollbar();
  }

  /**
   * Report this error to Rollbar with appropriate context
   */
  private reportToRollbar(): void {
    try {
      const errorContext = createErrorContext();
      errorContext.additionalData = {
        errorCode: this.errorCode,
        category: this.category,
        statusCode: this.statusCode,
        context: this.context,
        className: this.constructor.name,
        cause: this.cause?.message,
      };

      // Determine severity based on status code and category
      let severity: ErrorSeverityType = ErrorSeverity.ERROR;

      if (this.statusCode >= 500) {
        severity = ErrorSeverity.CRITICAL;
      } else if (this.statusCode === 404) {
        // 404 Not Found is a normal HTTP response, log as INFO not ERROR
        severity = ErrorSeverity.INFO;
      } else if (this.statusCode >= 400 && this.statusCode < 500) {
        severity =
          this.category === 'auth'
            ? ErrorSeverity.CRITICAL
            : ErrorSeverity.WARNING;
      } else if (this.statusCode < 400) {
        severity = ErrorSeverity.INFO;
      }

      reportError(this, errorContext, severity);
    } catch (_rollbarError) {
      // Silently fail rollbar reporting to avoid recursive errors
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Business Logic Errors
 * For domain-specific validation and business rule violations
 */
export abstract class BusinessError extends BaseError {
  readonly category = 'business' as const;
  // Use number type to allow subclasses to override (e.g., 404 for NotFound errors)
  readonly statusCode: number = 400;
}

/**
 * Infrastructure Errors
 * For database, external APIs, and system-level failures
 */
export abstract class InfrastructureError extends BaseError {
  readonly category = 'infrastructure' as const;
  readonly statusCode = 503;
}

/**
 * Validation Errors
 * For input validation and data format issues
 */
export abstract class ValidationError extends BaseError {
  readonly category = 'validation' as const;
  readonly statusCode = 422;
}

/**
 * Authentication/Authorization Errors
 * For security and access control issues
 */
export abstract class AuthError extends BaseError {
  readonly category = 'auth' as const;
  readonly statusCode = 401;
}
