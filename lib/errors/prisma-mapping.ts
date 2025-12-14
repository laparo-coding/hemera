/**
 * Prisma Error Mapping Utilities
 * Converts Prisma errors to domain-specific error types
 */

import { Prisma } from '@prisma/client';
import { prisma as basePrisma } from '../db/prisma';
import {
  BookingAlreadyExistsError,
  CourseSlugAlreadyExistsError,
  DatabaseConnectionError,
  DatabaseConstraintError,
  DatabaseValidationError,
  FieldValidationError,
  UserEmailAlreadyExistsError,
} from './';

/**
 * Convert Prisma errors to domain errors
 */
export function mapPrismaError(
  error: unknown,
  context?: Record<string, unknown>
): Error {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    // Handle other Prisma errors
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new DatabaseConnectionError('Unknown database error', error);
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new DatabaseValidationError(error.message);
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new DatabaseConnectionError(
        'Database initialization failed',
        error
      );
    }

    // Return generic database error for other cases
    return new DatabaseConnectionError(
      'Unexpected database error',
      error as Error
    );
  }

  const prismaError = error as Prisma.PrismaClientKnownRequestError;

  switch (prismaError.code) {
    // Unique constraint violations
    case 'P2002':
      return handleUniqueConstraintViolation(prismaError, context);

    // Foreign key constraint violations
    case 'P2003':
      return new DatabaseConstraintError(
        'Foreign key constraint',
        (prismaError.meta?.table as string) || 'unknown'
      );

    // Record not found
    case 'P2025':
      return new DatabaseConnectionError(
        'Record not found for operation',
        prismaError
      );

    // Required field missing
    case 'P2012':
      return new FieldValidationError('unknown', 'Required field missing');

    // Value too long for column
    case 'P2000':
      return new FieldValidationError(
        'unknown',
        'Value too long for database field'
      );

    // Value out of range for column type
    case 'P2006':
      return new FieldValidationError(
        'unknown',
        'Value out of range for field type'
      );

    // Inconsistent column data
    case 'P2007':
      return new FieldValidationError('unknown', 'Inconsistent column data');

    // Connection timeout
    case 'P1008':
      return new DatabaseConnectionError(
        'Database connection timeout',
        prismaError
      );

    // Connection refused
    case 'P1001':
      return new DatabaseConnectionError(
        'Database connection refused',
        prismaError
      );

    // Database does not exist
    case 'P1003':
      return new DatabaseConnectionError(
        'Database does not exist',
        prismaError
      );

    // Authentication failed
    case 'P1000':
      return new DatabaseConnectionError(
        'Database authentication failed',
        prismaError
      );

    default:
      return new DatabaseConnectionError(
        `Prisma error ${prismaError.code}: ${prismaError.message}`,
        prismaError
      );
  }
}

/**
 * Handle unique constraint violations with domain-specific errors
 */
function handleUniqueConstraintViolation(
  error: Prisma.PrismaClientKnownRequestError,
  context?: Record<string, unknown>
): Error {
  const constraint = error.meta?.target as string[] | string;
  const table = error.meta?.table as string;

  // Convert constraint array to string for easier matching
  const constraintStr = Array.isArray(constraint)
    ? constraint.join('_')
    : constraint;

  // Map specific constraints to domain errors
  switch (true) {
    case constraintStr?.includes('email') || table === 'User':
      return new UserEmailAlreadyExistsError(
        typeof context?.email === 'string' ? context.email : 'unknown'
      );

    case constraintStr?.includes('slug') || table === 'Course':
      return new CourseSlugAlreadyExistsError(
        typeof context?.slug === 'string' ? context.slug : 'unknown'
      );

    case constraintStr?.includes('userId_courseId') || table === 'Booking':
      return new BookingAlreadyExistsError(
        typeof context?.userId === 'string' ? context.userId : 'unknown',
        typeof context?.courseId === 'string' ? context.courseId : 'unknown'
      );

    default:
      return new DatabaseConstraintError(
        `Unique constraint violation: ${constraintStr}`,
        table || 'unknown'
      );
  }
}

/**
 * Wrapper function for safe Prisma operations
 */
export async function safePrismaOperation<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapPrismaError(error, context);
  }
}

/**
 * Transaction wrapper with error mapping
 */
export async function safePrismaTransaction<T>(
  transaction: (prisma: Prisma.TransactionClient) => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await basePrisma.$transaction(transaction);
  } catch (error) {
    throw mapPrismaError(error, context);
  }
}

// Re-export prisma with error mapping
export { basePrisma as prisma };
