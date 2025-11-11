// Clerk-based permissions helpers
import { currentUser } from '@clerk/nextjs/server';

export type UserRole = 'user' | 'admin' | 'moderator';

export interface NavigationItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

/**
 * Get user role from Clerk metadata
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  return (user?.publicMetadata?.role as UserRole) || 'user';
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
