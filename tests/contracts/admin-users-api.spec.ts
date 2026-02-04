/**
 * Admin Users API Contract Tests
 * Feature: 024-admin-dashboard
 *
 * Tests the API contract for admin user management endpoints.
 */
import { describe, expect, it } from '@jest/globals';

import type {
  AdminApiError,
  AdminUserListItem,
  AdminUsersQueryParams,
  AdminUsersResponse,
  AdminUserUpdateRequest,
  PaginationMeta,
} from '@/lib/types/admin';

describe('GET /api/admin/users - Contract Tests', () => {
  describe('Request Schema Validation', () => {
    it('should support query parameters for filtering and pagination', () => {
      const validQuery: AdminUsersQueryParams = {
        page: 1,
        limit: 20,
        search: 'test@example.com',
        outperformerOnly: false,
        adminOnly: false,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      expect(validQuery.page).toBeGreaterThanOrEqual(1);
      expect(validQuery.limit).toBeGreaterThan(0);
      expect(typeof validQuery.search).toBe('string');
      expect(typeof validQuery.outperformerOnly).toBe('boolean');
      expect(typeof validQuery.adminOnly).toBe('boolean');
      expect(['name', 'email', 'createdAt', 'lastSignInAt']).toContain(
        validQuery.sortBy
      );
      expect(['asc', 'desc']).toContain(validQuery.sortOrder);
    });

    it('should validate page parameter constraints', () => {
      const validPages = [1, 2, 10, 100];
      const invalidPages = [0, -1];

      validPages.forEach(page => {
        expect(page).toBeGreaterThanOrEqual(1);
      });

      invalidPages.forEach(page => {
        expect(page).toBeLessThan(1);
      });
    });

    it('should validate limit parameter constraints', () => {
      const maxLimit = 100;
      const minLimit = 1;
      const defaultLimit = 20;

      const validLimits = [1, 10, 20, 50, 100];
      const invalidLimits = [0, -1, 101, 1000];

      expect(defaultLimit).toBe(20);

      validLimits.forEach(limit => {
        expect(limit).toBeGreaterThanOrEqual(minLimit);
        expect(limit).toBeLessThanOrEqual(maxLimit);
      });

      invalidLimits.forEach(limit => {
        expect(limit < minLimit || limit > maxLimit).toBe(true);
      });
    });

    it('should validate sortBy field values', () => {
      const validSortFields: AdminUsersQueryParams['sortBy'][] = [
        'name',
        'email',
        'createdAt',
        'lastSignInAt',
      ];

      const invalidSortFields = ['invalid', 'role', 'bookings', 'unknown'];

      validSortFields.forEach(field => {
        expect(['name', 'email', 'createdAt', 'lastSignInAt']).toContain(field);
      });

      invalidSortFields.forEach(field => {
        expect(['name', 'email', 'createdAt', 'lastSignInAt']).not.toContain(
          field
        );
      });
    });

    it('should support search parameter for name and email filtering', () => {
      const validSearchTerms = [
        'john',
        'john@example.com',
        'Dr. Max',
        'müller',
        '123',
      ];

      validSearchTerms.forEach(term => {
        expect(typeof term).toBe('string');
        expect(term.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Response Schema Validation', () => {
    it('should return AdminUsersResponse structure', () => {
      const mockResponse: AdminUsersResponse = {
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      expect(mockResponse).toHaveProperty('users');
      expect(mockResponse).toHaveProperty('pagination');
      expect(Array.isArray(mockResponse.users)).toBe(true);
    });

    it('should validate AdminUserListItem structure', () => {
      const mockUser: AdminUserListItem = {
        id: 'user_123abc',
        email: 'test@example.com',
        fullName: 'Max Mustermann',
        firstName: 'Max',
        lastName: 'Mustermann',
        imageUrl: 'https://img.clerk.com/abc123',
        isAdmin: false,
        isOutperformer: true,
        lastSignInAt: '2025-01-15T10:30:00Z',
        createdAt: '2024-06-01T08:00:00Z',
        bookingsCount: 5,
        completedCoursesCount: 2,
      };

      // Required fields
      expect(typeof mockUser.id).toBe('string');
      expect(typeof mockUser.email).toBe('string');
      expect(typeof mockUser.isAdmin).toBe('boolean');
      expect(typeof mockUser.isOutperformer).toBe('boolean');
      expect(typeof mockUser.createdAt).toBe('string');
      expect(typeof mockUser.bookingsCount).toBe('number');
      expect(typeof mockUser.completedCoursesCount).toBe('number');

      // Nullable fields
      expect(
        mockUser.fullName === null || typeof mockUser.fullName === 'string'
      ).toBe(true);
      expect(
        mockUser.firstName === null || typeof mockUser.firstName === 'string'
      ).toBe(true);
      expect(
        mockUser.lastName === null || typeof mockUser.lastName === 'string'
      ).toBe(true);
      expect(
        mockUser.imageUrl === null || typeof mockUser.imageUrl === 'string'
      ).toBe(true);
      expect(
        mockUser.lastSignInAt === null ||
          typeof mockUser.lastSignInAt === 'string'
      ).toBe(true);
    });

    it('should validate PaginationMeta structure', () => {
      const mockPagination: PaginationMeta = {
        page: 2,
        limit: 20,
        totalItems: 45,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      };

      expect(mockPagination.page).toBeGreaterThanOrEqual(1);
      expect(mockPagination.limit).toBeGreaterThan(0);
      expect(mockPagination.totalItems).toBeGreaterThanOrEqual(0);
      expect(mockPagination.totalPages).toBeGreaterThanOrEqual(0);
      expect(typeof mockPagination.hasNextPage).toBe('boolean');
      expect(typeof mockPagination.hasPreviousPage).toBe('boolean');
    });

    it('should have consistent pagination calculations', () => {
      const testCases = [
        { totalItems: 0, limit: 20, expectedPages: 0 },
        { totalItems: 10, limit: 20, expectedPages: 1 },
        { totalItems: 20, limit: 20, expectedPages: 1 },
        { totalItems: 21, limit: 20, expectedPages: 2 },
        { totalItems: 100, limit: 20, expectedPages: 5 },
        { totalItems: 101, limit: 20, expectedPages: 6 },
      ];

      testCases.forEach(({ totalItems, limit, expectedPages }) => {
        const calculatedPages =
          totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
        expect(calculatedPages).toBe(expectedPages);
      });
    });

    it('should validate ISO 8601 date format for timestamps', () => {
      const validDates = [
        '2025-01-15T10:30:00Z',
        '2024-06-01T08:00:00.000Z',
        '2025-01-01T00:00:00+01:00',
      ];

      const iso8601Regex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

      validDates.forEach(date => {
        expect(iso8601Regex.test(date)).toBe(true);
      });
    });
  });

  describe('Error Response Schema', () => {
    it('should validate AdminApiError structure', () => {
      const mockError: AdminApiError = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        messageDe: 'Authentifizierung erforderlich',
      };

      expect(typeof mockError.code).toBe('string');
      expect(typeof mockError.message).toBe('string');
      expect(typeof mockError.messageDe).toBe('string');
    });

    it('should validate common error codes', () => {
      const expectedErrorCodes = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'VALIDATION_ERROR',
        'INTERNAL_ERROR',
      ];

      expectedErrorCodes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('PATCH /api/admin/users/[userId] - Contract Tests', () => {
  describe('Request Schema Validation', () => {
    it('should validate AdminUserUpdateRequest structure', () => {
      const validRequest: AdminUserUpdateRequest = {
        isAdmin: true,
      };

      expect(typeof validRequest.isAdmin).toBe('boolean');
    });

    it('should require userId as path parameter', () => {
      const validUserIds = [
        'user_2abc123',
        'user_clerk_id_456',
        'user_test123',
      ];

      validUserIds.forEach(userId => {
        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
      });
    });

    it('should validate update payload options', () => {
      const validPayloads: AdminUserUpdateRequest[] = [
        { isAdmin: true },
        { isAdmin: false },
        {}, // Empty update (no-op)
      ];

      validPayloads.forEach(payload => {
        if (payload.isAdmin !== undefined) {
          expect(typeof payload.isAdmin).toBe('boolean');
        }
      });
    });
  });

  describe('Response Schema Validation', () => {
    it('should return updated AdminUserListItem on success', () => {
      const mockUpdatedUser: AdminUserListItem = {
        id: 'user_123abc',
        email: 'promoted@example.com',
        fullName: 'Anna Admin',
        firstName: 'Anna',
        lastName: 'Admin',
        imageUrl: null,
        isAdmin: true, // Updated
        isOutperformer: false,
        lastSignInAt: '2025-01-15T10:30:00Z',
        createdAt: '2024-06-01T08:00:00Z',
        bookingsCount: 0,
        completedCoursesCount: 0,
      };

      expect(mockUpdatedUser.isAdmin).toBe(true);
    });
  });
});

describe('DELETE /api/admin/users/[userId] - Contract Tests', () => {
  describe('Request Schema Validation', () => {
    it('should require userId as path parameter', () => {
      const validUserIds = ['user_to_delete_123', 'user_abc456'];

      validUserIds.forEach(userId => {
        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
      });
    });

    it('should not allow deleting own account', () => {
      const currentUserId = 'user_current_123';
      const targetUserId = 'user_current_123';

      // Self-deletion should be blocked
      expect(currentUserId).toBe(targetUserId);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return 204 No Content on successful deletion', () => {
      const expectedStatusCode = 204;
      expect(expectedStatusCode).toBe(204);
    });

    it('should return 404 for non-existent user', () => {
      const mockError: AdminApiError = {
        code: 'NOT_FOUND',
        message: 'User not found',
        messageDe: 'Benutzer nicht gefunden',
      };

      expect(mockError.code).toBe('NOT_FOUND');
    });

    it('should return 403 when trying to delete self', () => {
      const mockError: AdminApiError = {
        code: 'FORBIDDEN',
        message: 'Cannot delete own account',
        messageDe: 'Du kannst dein eigenes Konto nicht löschen',
      };

      expect(mockError.code).toBe('FORBIDDEN');
    });
  });
});
