/**
 * Admin Permissions Helper
 *
 * Adds isAdmin helper to existing permissions module for server actions and API routes.
 */

import { currentUser } from '@clerk/nextjs/server';
import { syncUserFromClerk } from '../api/users';
import { isAdmin as checkIsAdmin } from './permissions';

/**
 * Require admin role and return the admin's DB user ID for audit trails.
 *
 * - Uses Clerk to verify authentication and role (via permissions.isAdmin)
 * - Ensures a corresponding DB user exists via syncUserFromClerk
 * - Returns the DB user's ID (not the Clerk ID)
 */
export async function requireAdmin(): Promise<string> {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    throw new Error('AUTH_NOT_AUTHENTICATED');
  }

  const hasAdminRole = await checkIsAdmin();

  if (!hasAdminRole) {
    throw new Error('AUTH_INSUFFICIENT_PERMISSIONS');
  }

  const dbUser = await syncUserFromClerk(clerkUser);
  return dbUser.id;
}

/**
 * Re-export existing helpers
 */
export {
  canManageCourses,
  getUserRole,
  hasPermission,
  isAdmin,
} from './permissions';
