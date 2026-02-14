// Clerk-based permissions helpers
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { ErrorSeverity, reportError } from '@/lib/monitoring/rollbar-official';

export type UserRole = 'user' | 'admin' | 'moderator' | 'api-client';

const VALID_ROLES: readonly UserRole[] = [
  'user',
  'admin',
  'moderator',
  'api-client',
] as const;

export interface NavigationItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

/**
 * Get user role from Clerk metadata with comprehensive error handling
 * If `userId` is provided, fetch the Clerk user via `clerkClient.users.getUser`.
 * Otherwise, fall back to `currentUser()` (server-side request context).
 *
 * Error handling:
 * - Wraps all Clerk API calls in try-catch
 * - Normalizes errors (no backend details leaked)
 * - Falls back to 'user' role on any error (safe default)
 * - Logs errors to Rollbar for monitoring
 * - Never throws exceptions in production
 */
export async function getUserRole(userId?: string): Promise<UserRole> {
  let role: unknown = null;

  // Try to fetch role from specific user ID
  if (userId) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      role = user?.publicMetadata?.role;
    } catch (_err) {
      // Log Clerk API error but continue with fallback
      reportError(
        new Error('Failed to fetch user role from Clerk by userId'),
        {
          additionalData: {
            userId,
            operation: 'getUserRole',
            errorType: 'clerk_api_error',
            // originalError omitted to avoid leaking backend error messages
            originalError: '[redacted]',
          },
        },
        ErrorSeverity.WARNING
      );
      role = null;
    }
  }

  // Fallback to current user context if no role yet
  if (!role) {
    try {
      const user = await currentUser();
      role = user?.publicMetadata?.role;
    } catch (_err) {
      // Log currentUser() error and fall back to safe default
      reportError(
        new Error('Failed to fetch current user from Clerk'),
        {
          additionalData: {
            operation: 'getUserRole',
            errorType: 'clerk_current_user_error',
            // originalError omitted to avoid leaking backend error messages
            originalError: '[redacted]',
          },
        },
        ErrorSeverity.WARNING
      );
      // Return safe default role
      return 'user';
    }
  }

  // Normalize to lowercase string and validate against known roles
  if (typeof role === 'string') {
    const normalizedRole = role.toLowerCase().trim();
    if ((VALID_ROLES as readonly string[]).includes(normalizedRole)) {
      return normalizedRole as UserRole;
    }
  }

  // Safe default fallback
  return 'user';
}

/**
 * Check if user has specific permission with error handling
 *
 * Error handling:
 * - Wraps currentUser() call in try-catch
 * - Falls back to false (deny access) on errors
 * - Logs errors to Rollbar for monitoring
 * - Never throws exceptions in production
 */
export async function hasPermission(permission: string): Promise<boolean> {
  try {
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
      'api-client': [
        'read:courses',
        'read:participations',
        'write:participation-results',
      ],
    };

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes('*') || permissions.includes(permission);
  } catch (_err) {
    // Log error and deny access by default (safe fallback)
    reportError(
      new Error('Failed to check user permission'),
      {
        additionalData: {
          permission,
          operation: 'hasPermission',
          errorType: 'permission_check_error',
          // originalError redacted to avoid leaking backend/internal messages
          originalError: '[redacted]',
        },
      },
      ErrorSeverity.WARNING
    );
    return false;
  }
}

/**
 * Check if user can manage courses
 */
export async function canManageCourses(): Promise<boolean> {
  return await hasPermission('manage:courses');
}

/**
 * Check if user is admin with error handling
 *
 * Error handling:
 * - Wraps getUserRole() call in try-catch
 * - Falls back to false (deny admin access) on errors
 * - Logs errors to Rollbar for monitoring
 * - Never throws exceptions in production
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const role = await getUserRole();
    return role === 'admin';
  } catch (_err) {
    // Log error and deny admin access by default (safe fallback)
    reportError(
      new Error('Failed to check admin status'),
      {
        additionalData: {
          operation: 'isAdmin',
          errorType: 'admin_check_error',
          // originalError redacted to avoid leaking backend/internal messages
          originalError: '[redacted]',
        },
      },
      ErrorSeverity.WARNING
    );
    return false;
  }
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
