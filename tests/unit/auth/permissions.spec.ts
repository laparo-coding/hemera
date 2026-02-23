/**
 * Permissions Helpers Tests
 * Tests for role-based permission checks
 */

import type { User } from '@clerk/nextjs/server';

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
  clerkClient: jest.fn(),
}));

// Mock Rollbar
jest.mock('@/lib/monitoring/rollbar-official', () => ({
  reportError: jest.fn(),
  ErrorSeverity: {
    CRITICAL: 'critical',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    DEBUG: 'debug',
  },
}));

// Import after mocks
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { reportError } from '@/lib/monitoring/rollbar-official';
import {
  getUserRole,
  hasPermission,
  canManageCourses,
  isAdmin,
  filterNavigationByRole,
  type NavigationItem,
} from '@/lib/auth/permissions';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockClerkClient = clerkClient as jest.MockedFunction<typeof clerkClient>;
const mockReportError = reportError as jest.MockedFunction<typeof reportError>;

describe('Permissions Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('should return admin role from metadata', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'admin' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('admin');
    });

    it('should return moderator role from metadata', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'moderator' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('moderator');
    });

    it('should default to user role when no metadata', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: {},
      } as User);

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should default to user role when user is null', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should normalize uppercase role to lowercase', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'ADMIN' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('admin');
    });

    it('should trim whitespace from role', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: '  moderator  ' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('moderator');
    });

    it('should fallback to user for invalid role', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'invalid_role' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('user');
    });

    it('should return api-client role from metadata', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('api-client');
    });

    it('should normalize uppercase api-client role', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'API-CLIENT' },
      } as unknown as User);

      const role = await getUserRole();

      expect(role).toBe('api-client');
    });

    describe('with userId parameter', () => {
      it('should return role from clerkClient when provided', async () => {
        const getUser = jest.fn().mockResolvedValue({ publicMetadata: { role: 'api-client' } });
        mockClerkClient.mockResolvedValue({ users: { getUser } } as any);
        // ensure currentUser would not be used
        mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'user' } } as unknown as User);

        const role = await getUserRole('svc-1');

        expect(getUser).toHaveBeenCalledWith('svc-1');
        expect(role).toBe('api-client');
        expect(mockCurrentUser).not.toHaveBeenCalled();
      });

      it('should fallback to user when clerkClient returns no role', async () => {
        const getUser = jest.fn().mockResolvedValue({ publicMetadata: {} });
        mockClerkClient.mockResolvedValue({ users: { getUser } } as any);
        mockCurrentUser.mockResolvedValue({ publicMetadata: { role: 'admin' } } as unknown as User);

        const role = await getUserRole('svc-2');

        expect(getUser).toHaveBeenCalledWith('svc-2');
        expect(role).toBe('user');
        expect(mockCurrentUser).not.toHaveBeenCalled();
      });

      it('should normalize and trim role from clerkClient', async () => {
        const getUser = jest.fn().mockResolvedValue({ publicMetadata: { role: '  API-CLIENT  ' } });
        mockClerkClient.mockResolvedValue({ users: { getUser } } as any);
        mockCurrentUser.mockResolvedValue(null);

        const role = await getUserRole('svc-3');

        expect(role).toBe('api-client');
      });
    });

    describe('Error Handling', () => {
      it('should fallback to user role when clerkClient throws error', async () => {
        mockClerkClient.mockResolvedValue({
          users: {
            getUser: jest.fn().mockRejectedValue(new Error('Clerk API error')),
          },
        } as any);
        // Ensure currentUser also returns null so we get the safe default
        mockCurrentUser.mockResolvedValue(null);

        const role = await getUserRole('user-123');

        expect(role).toBe('user');
        expect(mockReportError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to fetch user role from Clerk by userId',
          }),
          expect.objectContaining({
            additionalData: expect.objectContaining({
              userId: 'user-123',
              operation: 'getUserRole',
              errorType: 'clerk_api_error',
            }),
          }),
          'warning'
        );
      });

      it('should fallback to user role when currentUser throws error', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Clerk currentUser error'));

        const role = await getUserRole();

        expect(role).toBe('user');
        expect(mockReportError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to fetch current user from Clerk',
          }),
          expect.objectContaining({
            additionalData: expect.objectContaining({
              operation: 'getUserRole',
              errorType: 'clerk_current_user_error',
            }),
          }),
          'warning'
        );
      });

      it('should not throw exceptions on Clerk errors', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Network error'));

        await expect(getUserRole()).resolves.toBe('user');
      });
    });
  });

  describe('hasPermission', () => {
    it('admin should have all permissions', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'admin' },
      } as unknown as User);

      expect(await hasPermission('any:permission')).toBe(true);
      expect(await hasPermission('manage:courses')).toBe(true);
      expect(await hasPermission('delete:users')).toBe(true);
    });

    it('moderator should have manage:courses permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'moderator' },
      } as unknown as User);

      expect(await hasPermission('manage:courses')).toBe(true);
      expect(await hasPermission('read:courses')).toBe(true);
    });

    it('user should only have read:courses permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'user' },
      } as unknown as User);

      expect(await hasPermission('read:courses')).toBe(true);
      expect(await hasPermission('manage:courses')).toBe(false);
    });

    it('should return false when user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null);

      expect(await hasPermission('read:courses')).toBe(false);
    });

    it('api-client should have read:courses permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'service-user-1',
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      expect(await hasPermission('read:courses')).toBe(true);
    });

    it('api-client should have read:participations permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'service-user-1',
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      expect(await hasPermission('read:participations')).toBe(true);
    });

    it('api-client should have write:participation-results permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'service-user-1',
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      expect(await hasPermission('write:participation-results')).toBe(true);
    });

    it('api-client should NOT have manage:courses permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'service-user-1',
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      expect(await hasPermission('manage:courses')).toBe(false);
    });

    it('api-client should NOT have delete:users permission', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'service-user-1',
        publicMetadata: { role: 'api-client' },
      } as unknown as User);

      expect(await hasPermission('delete:users')).toBe(false);
    });

    describe('Error Handling', () => {
      it('should return false when currentUser throws error', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Clerk API error'));

        const result = await hasPermission('read:courses');

        expect(result).toBe(false);
        expect(mockReportError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to check user permission',
          }),
          expect.objectContaining({
            additionalData: expect.objectContaining({
              permission: 'read:courses',
              operation: 'hasPermission',
              errorType: 'permission_check_error',
            }),
          }),
          'warning'
        );
      });

      it('should not throw exceptions on errors', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Network error'));

        await expect(hasPermission('manage:courses')).resolves.toBe(false);
      });
    });
  });

  describe('canManageCourses', () => {
    it('should return true for admin', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'admin' },
      } as unknown as User);

      expect(await canManageCourses()).toBe(true);
    });

    it('should return true for moderator', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'moderator' },
      } as unknown as User);

      expect(await canManageCourses()).toBe(true);
    });

    it('should return false for regular user', async () => {
      mockCurrentUser.mockResolvedValue({
        id: 'user-1',
        publicMetadata: { role: 'user' },
      } as unknown as User);

      expect(await canManageCourses()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'admin' },
      } as unknown as User);

      expect(await isAdmin()).toBe(true);
    });

    it('should return false for non-admin roles', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'user' },
      } as unknown as User);

      expect(await isAdmin()).toBe(false);
    });

    describe('Error Handling', () => {
      it('should return false when getUserRole throws error', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Clerk API error'));

        const result = await isAdmin();

        expect(result).toBe(false);
        expect(mockReportError).toHaveBeenCalled();
      });

      it('should not throw exceptions on errors', async () => {
        mockCurrentUser.mockRejectedValue(new Error('Network error'));

        await expect(isAdmin()).resolves.toBe(false);
      });
    });
  });

  describe('filterNavigationByRole', () => {
    const navItems: NavigationItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
      { label: 'Admin', href: '/admin', roles: ['admin'] },
      { label: 'Moderate', href: '/moderate', roles: ['admin', 'moderator'] },
    ];

    it('admin should see all items', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'admin' },
      } as unknown as User);

      const filtered = await filterNavigationByRole(navItems);

      expect(filtered.length).toBe(4);
    });

    it('moderator should see moderation items but not admin', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'moderator' },
      } as unknown as User);

      const filtered = await filterNavigationByRole(navItems);

      expect(filtered.length).toBe(3);
      expect(filtered.map(i => i.label)).toContain('Moderate');
      expect(filtered.map(i => i.label)).not.toContain('Admin');
    });

    it('user should only see unrestricted items', async () => {
      mockCurrentUser.mockResolvedValue({
        publicMetadata: { role: 'user' },
      } as unknown as User);

      const filtered = await filterNavigationByRole(navItems);

      expect(filtered.length).toBe(2);
      expect(filtered.map(i => i.label)).toEqual(['Home', 'Courses']);
    });
  });
});
