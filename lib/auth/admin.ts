/**
 * Admin Permissions Helper
 *
 * Adds isAdmin helper to existing permissions module for server actions and API routes.
 */

import { auth } from '@clerk/nextjs/server';
import { isAdmin as checkIsAdmin } from './permissions';

/**
 * Check if current user has admin role and return admin ID for audit trail
 * Throws error if not authenticated or not admin
 * @returns adminId - The authenticated admin's user ID
 */
export async function requireAdmin(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('AUTH_NOT_AUTHENTICATED');
  }

  const hasAdminRole = await checkIsAdmin();

  if (!hasAdminRole) {
    throw new Error('AUTH_INSUFFICIENT_PERMISSIONS');
  }

  return userId;
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
