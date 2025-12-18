/**
 * Admin Permissions Helper
 *
 * Adds isAdmin helper to existing permissions module for server actions and API routes.
 */

import { isAdmin as checkIsAdmin } from './permissions';

/**
 * Check if current user has admin role
 * Throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  const hasAdminRole = await checkIsAdmin();

  if (!hasAdminRole) {
    throw new Error('AUTH_INSUFFICIENT_PERMISSIONS');
  }
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
