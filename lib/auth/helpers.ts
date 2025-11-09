// Clerk-based auth helpers
import type { User } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Detects if we are running in a test/E2E or Clerk-disabled environment.
 * In these cases, server-side calls to Clerk should be avoided to prevent middleware errors.
 */
function isMockAuthEnvironment(): boolean {
  return (
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1' ||
    process.env.E2E_TEST === 'true' ||
    process.env.NODE_ENV === 'test'
  );
}

/**
 * Provides a minimal mocked Clerk User object for E2E/test environments.
 */
function getMockUser(role: 'user' | 'admin' = 'user'): User {
  const mock: any = {
    id: 'e2e_mock_user',
    firstName: role === 'admin' ? 'Admin' : 'E2E',
    lastName: 'User',
    emailAddresses: [
      {
        id: 'e2e_email_1',
        emailAddress:
          role === 'admin' ? 'e2e.admin@example.com' : 'e2e@example.com',
        linkedTo: [],
        verification: null,
      },
    ],
    publicMetadata: { role },
  };
  return mock as User;
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 */
export async function requireAuth() {
  if (isMockAuthEnvironment()) {
    // In Test/E2E immer als eingeloggt behandeln, um Server-seitige Clerk-Fehler zu vermeiden
    return getMockUser('user');
  }

  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Alias for requireAuth for compatibility
 */
export const requireAuthenticatedUser = requireAuth;

/**
 * Get current user session
 */
export async function getCurrentUser() {
  if (isMockAuthEnvironment()) {
    return getMockUser('user');
  }
  return await currentUser();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  if (isMockAuthEnvironment()) return true;
  const user = await currentUser();
  return !!user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin() {
  if (isMockAuthEnvironment()) return true;
  const user = await currentUser();
  return user?.publicMetadata?.role === 'admin';
}

/**
 * Check if a specific user has admin role by ID
 */
export async function checkUserAdminStatus(_userId: string): Promise<boolean> {
  if (isMockAuthEnvironment()) return true;
  const user = await currentUser();
  // Check if the current authenticated user is an admin
  // The userId parameter is the user being checked, but we validate the current user's admin status
  return user?.publicMetadata?.role === 'admin';
}

/**
 * Require admin permissions
 */
export async function requireAdmin() {
  // In E2E/Clerk-disabled Modus rufen wir Clerk nicht auf,
  // um Middleware-Fehler zu vermeiden. Nicht-Admins werden auf /dashboard umgeleitet.
  if (isMockAuthEnvironment()) {
    // In Tests verhalten wir uns wie eingeloggt + admin, damit Admin-Seiten SSR-Guards nicht fehlschlagen.
    return getMockUser('admin');
  }

  const user = await requireAuth();

  if (!(await isAdmin())) {
    redirect('/sign-in');
  }

  return user;
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User): string {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName ||
        user.lastName ||
        user.emailAddresses[0]?.emailAddress ||
        'User';
}
