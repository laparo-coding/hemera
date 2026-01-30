// Clerk-based permissions helpers
import { currentUser } from '@clerk/nextjs/server';

export type UserRole = 'user' | 'admin' | 'moderator';

const VALID_ROLES: readonly UserRole[] = [
  'user',
  'admin',
  'moderator',
] as const;

export interface NavigationItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

/**
 * Get user role from Clerk metadata
 * Falls back to 'user' if role is missing, undefined, or invalid
 * Normalizes role to lowercase to handle casing variations
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  // Normalize to lowercase string and validate against known roles
  if (typeof role === 'string') {
    const normalizedRole = role.toLowerCase().trim();
    if ((VALID_ROLES as readonly string[]).includes(normalizedRole)) {
      return normalizedRole as UserRole;
    }
  }

  return 'user';
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await currentUser();
  const userRole = await getUserRole();

  if (!user) return false;

  // Admin has all permissions
  if (userRole === 'admin') return true;

  // Define role-based permissions
  const rolePermissions: Record<UserRole, string[]> = {
    admin: ['*'], // All permissions
    moderator: ['read:courses', 'manage:courses'],
    user: ['read:courses'],
  };

  const permissions = rolePermissions[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Check if user can manage courses
 */
export async function canManageCourses(): Promise<boolean> {
  return await hasPermission('manage:courses');
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Filter navigation items by user role
 */
export async function filterNavigationByRole(
  items: NavigationItem[]
): Promise<NavigationItem[]> {
  const userRole = await getUserRole();

  return items.filter(item => {
    if (!item.roles || item.roles.length === 0) {
      return true; // No role restriction
    }

    return item.roles.includes(userRole);
  });
}
