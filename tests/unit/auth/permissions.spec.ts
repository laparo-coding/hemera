/**
 * Permissions Helpers Tests
 * Tests for role-based permission checks
 */

import type { User } from '@clerk/nextjs/server';

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}));

// Import after mocks
import { currentUser } from '@clerk/nextjs/server';
import {
  getUserRole,
  hasPermission,
  canManageCourses,
  isAdmin,
  filterNavigationByRole,
  type NavigationItem,
} from '@/lib/auth/permissions';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

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
