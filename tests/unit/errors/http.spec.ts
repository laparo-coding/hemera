/**
 * HTTP Error Response Tests
 * Tests for converting domain errors to HTTP responses
 */

import { NextResponse } from 'next/server';
import { toHttpError, withErrorHandling } from '@/lib/errors/http';
import { BaseError } from '@/lib/errors/base';

// Mock modules
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

vi.mock('@/lib/services/error-analytics', () => ({
  errorAnalytics: {
    recordError: vi.fn(),
  },
}));

vi.mock('@/lib/utils/request-context', () => ({
  getRequestId: vi.fn().mockResolvedValue('test-req-id'),
  getRequestContext: vi.fn().mockResolvedValue({
    userAgent: 'TestAgent',
    ip: '127.0.0.1',
  }),
  logErrorWithContext: vi.fn(),
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
      expect(body.error).toMatchObject({
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        category: 'infrastructure',
        statusCode: 500,
      });
      expect(body.error.requestId).toBe('test-req-id');
      expect(body.error.timestamp).toBeDefined();
    });

    it('should use provided requestId', async () => {
      const error = new Error('Test');

      const response = await toHttpError(error, 'custom-req-id');
      const body = await response.json();

      expect(body.error.requestId).toBe('custom-req-id');
    });

    it('should handle Prisma validation errors with correct status codes', async () => {
      // Create error with Prisma-like structure (clientVersion + validation message)
      const prismaError = new Error('Invalid `prisma.course.create()` invocation');
      (prismaError as unknown as Record<string, unknown>).clientVersion = '5.0.0';

      const response = await toHttpError(prismaError);

      expect(response.status).toBe(422);
    });

    it('should handle Prisma known request errors with correct status codes', async () => {
      // Create error with Prisma-like structure (code starting with P)
      const prismaError = new Error('Unique constraint failed');
      (prismaError as unknown as Record<string, unknown>).code = 'P2002';
      (prismaError as unknown as Record<string, unknown>).clientVersion = '5.0.0';

      const response = await toHttpError(prismaError);

      expect(response.status).toBe(400);
    });

    it('should handle Prisma unknown errors with 500 status', async () => {
      // Create error with only clientVersion (unknown Prisma error)
      const prismaError = new Error('Database connection failed');
      (prismaError as unknown as Record<string, unknown>).clientVersion = '5.0.0';

      const response = await toHttpError(prismaError);

      expect(response.status).toBe(500);
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
