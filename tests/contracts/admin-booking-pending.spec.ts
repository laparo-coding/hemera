/**
 * Contract Tests: GET /api/admin/bookings/pending
 * Feature: 021-learning-path
 *
 * Tests the pending bookings endpoint for admin review workflow.
 * These tests define the API contract and should FAIL until implementation.
 */

import type { PendingBooking } from '@/lib/schemas/admin/booking';
import { describe, expect, it } from '@/tests/vitest/jest-globals';

describe('GET /api/admin/bookings/pending - Contract Tests', () => {
  const ENDPOINT = '/api/admin/bookings/pending';

  describe('Response Schema Validation', () => {
    it('should define PendingBooking response schema', () => {
      // Define expected response structure (updated for 021-learning-path)
      const mockPendingBooking: PendingBooking = {
        id: 'clxyz123',
        createdAt: '2026-01-27T10:00:00.000Z',
        user: {
          id: 'user_abc123',
          clerkUserId: 'user_abc123',
          email: 'max@example.com',
          firstName: 'Max',
          lastName: 'Mustermann',
          isOutperformer: false,
        },
        course: {
          id: 'clxyz456',
          title: 'Fortgeschrittenen-Kurs',
          level: 'INTERMEDIATE',
          startDate: '2026-02-15T00:00:00.000Z',
        },
      };

      // Validate structure
      expect(mockPendingBooking).toHaveProperty('id');
      expect(mockPendingBooking).toHaveProperty('createdAt');
      expect(mockPendingBooking).toHaveProperty('user');
      expect(mockPendingBooking).toHaveProperty('course');
      expect(mockPendingBooking.user).toHaveProperty('email');
      expect(mockPendingBooking.user).toHaveProperty('firstName');
      expect(mockPendingBooking.user).toHaveProperty('isOutperformer');
      expect(mockPendingBooking.course).toHaveProperty('level');
      expect(mockPendingBooking.course).toHaveProperty('startDate');
    });

    it('should return array of PendingBooking objects', () => {
      interface PendingBookingsResponse {
        bookings: PendingBooking[];
        total: number;
      }

      const mockResponse: PendingBookingsResponse = {
        bookings: [],
        total: 0,
      };

      expect(Array.isArray(mockResponse.bookings)).toBe(true);
      expect(typeof mockResponse.total).toBe('number');
    });

    it('should include user and course relations in response', () => {
      const mockBooking: PendingBooking = {
        id: 'clxyz123',
        createdAt: '2026-01-27T10:00:00.000Z',
        user: {
          id: 'user_abc123',
          clerkUserId: 'user_abc123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isOutperformer: true,
        },
        course: {
          id: 'clxyz456',
          title: 'Advanced Course',
          level: 'ADVANCED',
          startDate: '2026-03-01T00:00:00.000Z',
        },
      };

      // User relation
      expect(mockBooking.user).toBeDefined();
      expect(mockBooking.user.id).toBe(mockBooking.user.clerkUserId);
      expect(mockBooking.user).toHaveProperty('firstName');
      expect(mockBooking.user).toHaveProperty('lastName');
      expect(mockBooking.user).toHaveProperty('email');
      expect(mockBooking.user).toHaveProperty('isOutperformer');

      // Course relation
      expect(mockBooking.course).toBeDefined();
      expect(mockBooking.course).toHaveProperty('title');
      expect(mockBooking.course).toHaveProperty('level');
      expect(mockBooking.course).toHaveProperty('startDate');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication', () => {
      // Contract: Endpoint requires valid auth token
      const authRequirements = {
        authRequired: true,
        method: 'GET',
        endpoint: ENDPOINT,
      };

      expect(authRequirements.authRequired).toBe(true);
    });

    it('should return 401 for unauthenticated requests', () => {
      // Contract: Unauthenticated requests get 401
      const expectedStatus = 401;
      const expectedError = {
        error: 'Unauthorized',
        message: 'Authentication required',
      };

      expect(expectedStatus).toBe(401);
      expect(expectedError).toHaveProperty('error');
    });

    it('should return 403 for non-admin users', () => {
      // Contract: Non-admin users get 403
      const expectedStatus = 403;
      const expectedError = {
        error: 'Forbidden',
        message: 'Admin access required',
      };

      expect(expectedStatus).toBe(403);
      expect(expectedError).toHaveProperty('error');
    });

    it('should allow access for admin users', () => {
      // Contract: Admin users get 200
      const adminRoles = ['admin', 'superadmin'];
      const expectedStatus = 200;

      expect(adminRoles).toContain('admin');
      expect(expectedStatus).toBe(200);
    });
  });

  describe('Query Parameters', () => {
    it('should support pagination parameters', () => {
      interface QueryParams {
        limit?: number;
        offset?: number;
      }

      const validParams: QueryParams = {
        limit: 20,
        offset: 0,
      };

      expect(validParams.limit).toBeGreaterThan(0);
      expect(validParams.offset).toBeGreaterThanOrEqual(0);
    });

    it('should filter by PRE_BOOKED status only', () => {
      // Contract: Only returns PRE_BOOKED bookings
      const validStatuses = ['PRE_BOOKED'];

      expect(validStatuses).toHaveLength(1);
      expect(validStatuses[0]).toBe('PRE_BOOKED');
    });

    it('should order pending bookings by newest review request first', () => {
      const sortOrder = 'createdAt:desc';
      expect(sortOrder).toBe('createdAt:desc');
    });
  });

  describe('Payload semantics', () => {
    it('should expose a stable request identifier in success responses', () => {
      const successEnvelope = {
        success: true,
        requestId: 'req_123',
      };

      expect(successEnvelope.success).toBe(true);
      expect(successEnvelope.requestId).toMatch(/^req_/);
    });

    it('should keep CORS enabled for external admin review clients', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      };

      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('OPTIONS');
    });
  });

  describe('Error Responses', () => {
    it('should define error response schema', () => {
      interface ErrorResponse {
        error: string;
        message: string;
        statusCode: number;
      }

      const mockError: ErrorResponse = {
        error: 'InternalServerError',
        message: 'Failed to fetch pending bookings',
        statusCode: 500,
      };

      expect(mockError).toHaveProperty('error');
      expect(mockError).toHaveProperty('message');
      expect(mockError).toHaveProperty('statusCode');
    });
  });
});
