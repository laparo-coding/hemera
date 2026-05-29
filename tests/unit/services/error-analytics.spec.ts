/**
 * Error Analytics Service Tests
 * Tests for error tracking and metrics functionality
 */

import { errorAnalytics } from '@/lib/services/error-analytics';
import { BaseError } from '@/lib/errors/base';

// Mock the rollbar module to prevent actual reporting
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

// Create a concrete implementation of BaseError for testing
class TestBusinessError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'TEST_ERROR';
  readonly category = 'business' as const;
}

class TestInfraError extends BaseError {
  readonly statusCode = 503;
  readonly errorCode = 'INFRA_ERROR';
  readonly category = 'infrastructure' as const;
}

describe('ErrorAnalyticsService', () => {
  beforeEach(() => {
    // Clear logs before each test
    errorAnalytics.clearLogs();
  });

  describe('recordError', () => {
    it('should record a BaseError with all properties', () => {
      const error = new TestBusinessError('Test error message', {
        userId: '123',
      });

      errorAnalytics.recordError(error, {
        requestId: 'req-123',
        userAgent: 'TestAgent/1.0',
        ip: '127.0.0.1',
      });

      const { errors, total } = errorAnalytics.getRecentErrors();
      expect(total).toBe(1);
      expect(errors[0]!.errorCode).toBe('TEST_ERROR');
      expect(errors[0]!.category).toBe('business');
      expect(errors[0]!.message).toBe('Test error message');
      expect(errors[0]!.statusCode).toBe(400);
      expect(errors[0]!.requestId).toBe('req-123');
      expect(errors[0]!.userAgent).toBe('TestAgent/1.0');
      expect(errors[0]!.ip).toBe('127.0.0.1');
    });

    it('should record a regular Error with default values', () => {
      const error = new Error('Generic error');

      errorAnalytics.recordError(error);

      const { errors, total } = errorAnalytics.getRecentErrors();
      expect(total).toBe(1);
      expect(errors[0]!.errorCode).toBe('UNKNOWN_ERROR');
      expect(errors[0]!.category).toBe('infrastructure');
      expect(errors[0]!.statusCode).toBe(500);
      expect(errors[0]!.requestId).toBe('unknown');
    });

    it('should record error with additional context', () => {
      const error = new TestBusinessError('Test error');

      errorAnalytics.recordError(error, {
        additionalContext: { extra: 'data' },
      });

      const { errors } = errorAnalytics.getRecentErrors();
      expect(errors[0]!.context).toMatchObject({ extra: 'data' });
    });

    it('should limit stored errors to maxLogs', () => {
      // Record more than maxLogs errors
      for (let i = 0; i < 1100; i++) {
        errorAnalytics.recordError(new Error(`Error ${i}`));
      }

      const { total } = errorAnalytics.getRecentErrors(1, 2000);
      expect(total).toBeLessThanOrEqual(1000);
    });
  });

  describe('getErrorMetrics', () => {
    beforeEach(() => {
      // Add some test errors
      errorAnalytics.recordError(new TestBusinessError('Business error 1'));
      errorAnalytics.recordError(new TestBusinessError('Business error 2'));
      errorAnalytics.recordError(new TestInfraError('Infra error'));
    });

    it('should return correct error count', () => {
      const metrics = errorAnalytics.getErrorMetrics('day');
      expect(metrics.errorCount).toBe(3);
    });

    it('should group errors by category', () => {
      const metrics = errorAnalytics.getErrorMetrics('day');
      expect(metrics.errorsByCategory.business).toBe(2);
      expect(metrics.errorsByCategory.infrastructure).toBe(1);
    });

    it('should group errors by code', () => {
      const metrics = errorAnalytics.getErrorMetrics('day');
      expect(metrics.errorsByCode.TEST_ERROR).toBe(2);
      expect(metrics.errorsByCode.INFRA_ERROR).toBe(1);
    });

    it('should provide top errors sorted by count', () => {
      const metrics = errorAnalytics.getErrorMetrics('day');
      expect(metrics.topErrors.length).toBeGreaterThan(0);
      expect(metrics.topErrors[0]!.code).toBe('TEST_ERROR');
      expect(metrics.topErrors[0]!.count).toBe(2);
    });

    it('should filter by time range - hour', () => {
      const metrics = errorAnalytics.getErrorMetrics('hour');
      expect(metrics.errorCount).toBe(3);
    });

    it('should filter by time range - week', () => {
      const metrics = errorAnalytics.getErrorMetrics('week');
      expect(metrics.errorCount).toBe(3);
    });
  });

  describe('getRecentErrors', () => {
    beforeEach(() => {
      for (let i = 0; i < 100; i++) {
        errorAnalytics.recordError(new Error(`Error ${i}`));
      }
    });

    it('should paginate errors correctly', () => {
      const page1 = errorAnalytics.getRecentErrors(1, 10);
      expect(page1.errors.length).toBe(10);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(10);
      expect(page1.total).toBe(100);
      expect(page1.totalPages).toBe(10);
    });

    it('should return different errors for different pages', () => {
      const page1 = errorAnalytics.getRecentErrors(1, 10);
      const page2 = errorAnalytics.getRecentErrors(2, 10);

      expect(page1.errors[0]!.id).not.toBe(page2.errors[0]!.id);
    });

    it('should sort errors by timestamp descending', () => {
      const { errors } = errorAnalytics.getRecentErrors(1, 10);

      for (let i = 0; i < errors.length - 1; i++) {
        const current = new Date(errors[i]!.timestamp).getTime();
        const next = new Date(errors[i + 1]!.timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('resolveError', () => {
    it('should mark error as resolved', () => {
      errorAnalytics.recordError(new TestBusinessError('Test error'));
      const { errors } = errorAnalytics.getRecentErrors();
      const errorId = errors[0]!.id;

      const result = errorAnalytics.resolveError(errorId);

      expect(result).toBe(true);
      const { errors: updatedErrors } = errorAnalytics.getRecentErrors();
      expect(updatedErrors[0]!.resolved).toBe(true);
    });

    it('should return false for non-existent error', () => {
      const result = errorAnalytics.resolveError('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('clearLogs', () => {
    it('should remove all error logs', () => {
      errorAnalytics.recordError(new Error('Test'));
      errorAnalytics.recordError(new Error('Test 2'));

      errorAnalytics.clearLogs();

      const { total } = errorAnalytics.getRecentErrors();
      expect(total).toBe(0);
    });
  });
});
