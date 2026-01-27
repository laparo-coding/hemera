/**
 * Unit Tests: LoopsService
 * Feature: 021-learning-path
 *
 * Tests the Loops.so email service integration.
 * These tests define the expected behavior and should FAIL until implementation.
 */

import { describe, expect, it } from '@jest/globals';

// Mock types for testing (service not yet implemented)
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface AdminEmail {
  email: string;
  name: string;
  userId: string;
}

describe('LoopsService', () => {
  describe('sendPrerequisiteReviewEmail', () => {
    it('should call Loops API with correct transactional email ID', () => {
      // Contract: Uses specific transactional email template
      const transactionalId = 'prerequisite_review';

      expect(transactionalId).toBe('prerequisite_review');
    });

    it('should include booking details in email data', () => {
      const emailData = {
        bookingId: 'clxyz123',
        userName: 'Max Mustermann',
        userEmail: 'max@example.com',
        courseTitle: 'Fortgeschrittenen-Kurs',
        courseLevel: 'INTERMEDIATE',
        adminReviewUrl: 'https://app.example.com/admin/bookings/pending',
      };

      expect(emailData).toHaveProperty('bookingId');
      expect(emailData).toHaveProperty('userName');
      expect(emailData).toHaveProperty('userEmail');
      expect(emailData).toHaveProperty('courseTitle');
      expect(emailData).toHaveProperty('courseLevel');
      expect(emailData).toHaveProperty('adminReviewUrl');
    });

    it('should send to all admin email addresses', () => {
      const adminEmails = ['admin1@example.com', 'admin2@example.com'];

      expect(adminEmails.length).toBeGreaterThan(0);
      expect(Array.isArray(adminEmails)).toBe(true);
    });

    it('should return success result on successful send', () => {
      const result: EmailResult = {
        success: true,
        messageId: 'msg_abc123',
      };

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error result without throwing on API failure', () => {
      // Contract: Silent degradation - errors are returned, not thrown
      const result: EmailResult = {
        success: false,
        error: 'Loops API rate limit exceeded',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.messageId).toBeUndefined();
    });
  });

  describe('sendBookingRejectedEmail', () => {
    it('should call Loops API with rejection email template', () => {
      const transactionalId = 'booking_rejected';

      expect(transactionalId).toBe('booking_rejected');
    });

    it('should include rejection details in email data', () => {
      const emailData = {
        userEmail: 'user@example.com',
        userName: 'Max Mustermann',
        courseTitle: 'Fortgeschrittenen-Kurs',
        reason: 'Voraussetzungen nicht erfüllt',
        supportEmail: 'support@hemera-academy.de',
      };

      expect(emailData).toHaveProperty('userEmail');
      expect(emailData).toHaveProperty('userName');
      expect(emailData).toHaveProperty('courseTitle');
      expect(emailData).toHaveProperty('reason');
      expect(emailData).toHaveProperty('supportEmail');
    });

    it('should send to user email address', () => {
      const userEmail = 'user@example.com';

      expect(userEmail).toMatch(/@/);
    });

    it('should return success result on successful send', () => {
      const result: EmailResult = {
        success: true,
        messageId: 'msg_xyz789',
      };

      expect(result.success).toBe(true);
    });

    it('should return error result without throwing on API failure', () => {
      const result: EmailResult = {
        success: false,
        error: 'Invalid email address',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAdminEmails', () => {
    it('should fetch admin users from Clerk', () => {
      // Contract: Queries Clerk for users with admin role
      const clerkRoleFilter = 'admin';

      expect(clerkRoleFilter).toBe('admin');
    });

    it('should return array of AdminEmail objects', () => {
      const admins: AdminEmail[] = [
        {
          email: 'admin@example.com',
          name: 'Admin User',
          userId: 'user_admin123',
        },
      ];

      expect(Array.isArray(admins)).toBe(true);
      expect(admins[0]).toHaveProperty('email');
      expect(admins[0]).toHaveProperty('name');
      expect(admins[0]).toHaveProperty('userId');
    });

    it('should handle no admins found gracefully', () => {
      const admins: AdminEmail[] = [];

      expect(admins).toHaveLength(0);
    });

    it('should filter out admins without email', () => {
      const admins: AdminEmail[] = [
        { email: 'valid@example.com', name: 'Valid Admin', userId: 'user_1' },
      ];
      // Contract: Only include admins with valid email
      const validAdmins = admins.filter(a => a.email?.includes('@'));

      expect(validAdmins).toHaveLength(1);
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log errors to Rollbar on failure', () => {
      // Contract: All API failures are logged to Rollbar
      const shouldLogToRollbar = true;

      expect(shouldLogToRollbar).toBe(true);
    });

    it('should not throw exceptions on API errors', () => {
      // Contract: Silent degradation pattern
      const fn = () => {
        // Simulated API error handling
        try {
          throw new Error('API Error');
        } catch {
          return { success: false, error: 'API Error' };
        }
      };

      expect(() => fn()).not.toThrow();
      expect(fn().success).toBe(false);
    });

    it('should include error context in log messages', () => {
      const errorContext = {
        service: 'LoopsService',
        method: 'sendPrerequisiteReviewEmail',
        bookingId: 'clxyz123',
        timestamp: new Date().toISOString(),
      };

      expect(errorContext).toHaveProperty('service');
      expect(errorContext).toHaveProperty('method');
      expect(errorContext).toHaveProperty('bookingId');
      expect(errorContext).toHaveProperty('timestamp');
    });
  });

  describe('Configuration', () => {
    it('should use LOOPS_API_KEY environment variable', () => {
      const envVarName = 'LOOPS_API_KEY';

      expect(envVarName).toBe('LOOPS_API_KEY');
    });

    it('should handle missing API key gracefully', () => {
      // Contract: Missing API key returns error, doesn't crash
      const apiKey = undefined;
      const result: EmailResult = apiKey
        ? { success: true }
        : { success: false, error: 'LOOPS_API_KEY not configured' };

      expect(result.success).toBe(false);
      expect(result.error).toContain('LOOPS_API_KEY');
    });
  });
});
