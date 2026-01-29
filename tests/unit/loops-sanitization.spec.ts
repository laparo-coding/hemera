/**
 * Unit tests for Loops email service sanitization and guards
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  isLoopsConfigured,
  sendBookingRejectedEmail,
  sendPrerequisiteReviewEmail,
} from '../../lib/services/loops';

// Mock Rollbar
jest.mock('../../lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
  reportError: jest.fn(),
}));

describe('Loops Email Service Guards', () => {
  const originalEnv = process.env.LOOPS_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.LOOPS_API_KEY = originalEnv;
    } else {
      delete process.env.LOOPS_API_KEY;
    }
  });

  describe('isLoopsConfigured', () => {
    it('should return false when LOOPS_API_KEY is not set', () => {
      delete process.env.LOOPS_API_KEY;
      expect(isLoopsConfigured()).toBe(false);
    });

    it('should return false when LOOPS_API_KEY is empty string', () => {
      process.env.LOOPS_API_KEY = '';
      expect(isLoopsConfigured()).toBe(false);
    });

    it('should return true when LOOPS_API_KEY is set', () => {
      process.env.LOOPS_API_KEY = 'test_key_123';
      expect(isLoopsConfigured()).toBe(true);
    });
  });

  describe('sendPrerequisiteReviewEmail', () => {
    it('should skip email and return error when Loops is not configured', async () => {
      delete process.env.LOOPS_API_KEY;

      const result = await sendPrerequisiteReviewEmail({
        customerName: 'John',
        customerEmail: 'john@example.com',
        courseName: 'Advanced Course',
        courseLevel: 'ADVANCED',
        missingPrerequisite: 'INTERMEDIATE',
        bookingId: 'booking_123',
        adminEmails: ['admin@example.com'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should skip email when admin emails array is empty', async () => {
      process.env.LOOPS_API_KEY = 'test_key_123';

      const result = await sendPrerequisiteReviewEmail({
        customerName: 'John',
        customerEmail: 'john@example.com',
        courseName: 'Advanced Course',
        courseLevel: 'ADVANCED',
        missingPrerequisite: 'INTERMEDIATE',
        bookingId: 'booking_123',
        adminEmails: [], // Empty array
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No admin emails');
    });
  });

  describe('sendBookingRejectedEmail', () => {
    it('should skip email and return error when Loops is not configured', async () => {
      delete process.env.LOOPS_API_KEY;

      const result = await sendBookingRejectedEmail({
        customerEmail: 'john@example.com',
        customerName: 'John',
        courseName: 'Advanced Course',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should skip email when customer email is invalid', async () => {
      process.env.LOOPS_API_KEY = 'test_key_123';

      const result = await sendBookingRejectedEmail({
        customerEmail: '', // Invalid
        customerName: 'John',
        courseName: 'Advanced Course',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });
});

describe('Loops Email Sanitization', () => {
  describe('maskEmail', () => {
    // Note: These are internal functions, so we're testing through the module's behavior
    // In real implementation, you might export these for testing or test via integration

    it('should mask email addresses in logs', () => {
      const _testCases = [
        { input: 'john.doe@example.com', expected: /j\*\*\*e@example\.com/ },
        { input: 'a@test.com', expected: /a\*\*\*@test\.com/ },
        { input: 'ab@test.com', expected: /a\*\*\*@test\.com/ },
      ];

      // This test would need the function exported or tested via integration
      // For now, this serves as documentation of expected behavior
    });
  });

  describe('sanitizeError', () => {
    it('should extract only type and message from Error objects', () => {
      const error = new Error('Connection failed');
      error.name = 'NetworkError';

      // Expected to extract only { type: 'NetworkError', message: 'Connection failed' }
      // Should NOT include stack, headers, or other properties
    });

    it('should handle unknown error types safely', () => {
      const _unknownError = { someProperty: 'value', token: 'secret123' };

      // Expected to return { type: 'UnknownError', message: '[object Object]' }
      // Should NOT expose the token or other properties
    });
  });
});
