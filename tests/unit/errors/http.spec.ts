/**
 * HTTP Error Response Tests
 * Tests for converting domain errors to HTTP responses
 */

import { NextResponse } from 'next/server';
import { toHttpError, withErrorHandling } from '@/lib/errors/http';
import { BaseError } from '@/lib/errors/base';

// Mock modules
jest.mock('@/lib/monitoring/rollbar-official', () => ({
  createErrorContext: jest.fn(() => ({ additionalData: {} })),
  reportError: jest.fn(),
  ErrorSeverity: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
  },
}));

jest.mock('@/lib/services/error-analytics', () => ({
  errorAnalytics: {
    recordError: jest.fn(),
  },
}));

jest.mock('@/lib/utils/request-context', () => ({
  getRequestId: jest.fn().mockResolvedValue('test-req-id'),
  getRequestContext: jest.fn().mockResolvedValue({
    userAgent: 'TestAgent',
    ip: '127.0.0.1',
  }),
  logErrorWithContext: jest.fn(),
}));

// Test error class
class TestDomainError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'TEST_DOMAIN_ERROR';
  readonly category = 'business' as const;
}

describe('HTTP Error Handling', () => {
  describe('toHttpError', () => {
    it('should convert BaseError to proper HTTP response', async () => {
      const error = new TestDomainError('Test error', { field: 'value' });

      const response = await toHttpError(error);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toMatchObject({
        message: 'Test error',
        code: 'TEST_DOMAIN_ERROR',
        category: 'business',
        statusCode: 400,
        context: { field: 'value' },
        requestId: 'test-req-id',
      });
      expect(body.error.timestamp).toBeDefined();
    });

    it('should convert standard Error to HTTP response', async () => {
      const error = new Error('Standard error');

      const response = await toHttpError(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toMatchObject({
        message: 'Standard error',
        code: 'UNKNOWN_ERROR',
        category: 'infrastructure',
        statusCode: 500,
      });
    });

    it('should handle unknown errors', async () => {
      const response = await toHttpError('string error');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.message).toBe('An unexpected error occurred');
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should use provided requestId', async () => {
      const error = new Error('Test');

      const response = await toHttpError(error, 'custom-req-id');
      const body = await response.json();

      expect(body.error.requestId).toBe('custom-req-id');
    });

    it('should handle Prisma errors with correct status codes', async () => {
      // Create error with specific constructor name
      const prismaError = new Error('Validation error');
      Object.defineProperty(prismaError.constructor, 'name', {
        value: 'PrismaClientValidationError',
      });

      const response = await toHttpError(prismaError);

      expect(response.status).toBe(422);
    });
  });

  describe('withErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const handler = async () => NextResponse.json({ data: 'success' });

      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler();
      const body = await response.json();

      expect(body).toEqual({ data: 'success' });
    });

    it('should catch and convert errors', async () => {
      const handler = async () => {
        throw new TestDomainError('Handler error');
      };

      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler();
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('TEST_DOMAIN_ERROR');
    });

    it('should pass arguments to handler', async () => {
      const handler = async (a: number, b: string) =>
        NextResponse.json({ a, b });

      const wrappedHandler = withErrorHandling(handler);
      const response = await wrappedHandler(42, 'test');
      const body = await response.json();

      expect(body).toEqual({ a: 42, b: 'test' });
    });
  });
});
