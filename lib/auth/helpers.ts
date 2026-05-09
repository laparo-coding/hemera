// Clerk-based auth helpers
import type { User } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';

import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { createErrorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { isEnvFlagEnabled } from '@/lib/utils/env-flags';

/**
 * Detects if we are running in a unit test environment.
 * - Only returns true for actual unit tests (NODE_ENV=test or JEST_WORKER_ID is set)
 * - Returns false for E2E tests (which need explicit server-side bypass flags)
 */
function isMockAuthEnvironment(): boolean {
  // Jest sets JEST_WORKER_ID when running tests
  const isJestRunning = !!process.env.JEST_WORKER_ID;
  return process.env.NODE_ENV === 'test' || isJestRunning;
}

function isProtectedDeploymentEnvironment(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

function hasExplicitServerAuthBypass(): boolean {
  return (
    isEnvFlagEnabled(process.env.E2E_TEST) ||
    isEnvFlagEnabled(process.env.DISABLE_CLERK_SERVER_AUTH)
  );
}

function shouldBypassClerkServerAuth(): boolean {
  if (hasExplicitServerAuthBypass()) {
    return true;
  }

  if (isProtectedDeploymentEnvironment()) {
    return false;
  }

  return false;
}

async function getCookieMockRole(): Promise<'user' | 'admin' | null> {
  if (
    isProtectedDeploymentEnvironment() &&
    !isMockAuthEnvironment() &&
    !hasExplicitServerAuthBypass()
  ) {
    return null;
  }

  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('hemera-e2e-role')?.value;
    return role === 'admin' || role === 'user' ? role : null;
  } catch {
    return null;
  }
}

async function getMockAuthRole(): Promise<'user' | 'admin' | null> {
  if (shouldBypassClerkServerAuth()) {
    const cookieRole = await getCookieMockRole();

    if (cookieRole) {
      return cookieRole;
    }

    if (isMockAuthEnvironment()) {
      return process.env.E2E_ADMIN === '1' ? 'admin' : 'user';
    }

    return null;
  }

  if (isMockAuthEnvironment()) {
    return process.env.E2E_ADMIN === '1' ? 'admin' : 'user';
  }

  return await getCookieMockRole();
}

/**
 * Provides a minimal mocked Clerk User object for E2E/test environments.
 */
function getMockUser(role: 'user' | 'admin' = 'user'): User {
  const mock: Partial<User> = {
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
  const mockRole = await getMockAuthRole();
  if (mockRole) {
    // In Test/E2E immer als eingeloggt behandeln, um Server-seitige Clerk-Fehler zu vermeiden
    return getMockUser(mockRole);
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
  const mockRole = await getMockAuthRole();
  if (mockRole) {
    return getMockUser(mockRole);
  }
  return await currentUser();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  if (await getMockAuthRole()) return true;
  const user = await currentUser();
  return !!user;
}

/**
 * Check if user has admin role
 */
export async function isAdmin() {
  if ((await getMockAuthRole()) === 'admin') return true;
  const user = await currentUser();
  return user?.publicMetadata?.role === 'admin';
}

/**
 * Check if the current user has admin role.
 * Pass an already-loaded User object to avoid a redundant currentUser() call.
 */
export async function checkUserAdminStatus(
  loadedUser?: User | null
): Promise<boolean> {
  const mockRole = await getMockAuthRole();
  if (mockRole) return mockRole === 'admin';
  const user = loadedUser ?? (await currentUser());
  return user?.publicMetadata?.role === 'admin';
}

/**
 * Require admin permissions
 */
export async function requireAdmin() {
  // In E2E/Clerk-disabled Modus rufen wir Clerk nicht auf.
  // Authentifizierte Nicht-Admins landen konsistent auf /dashboard.
  const mockRole = await getMockAuthRole();
  if (mockRole) {
    if (mockRole !== 'admin') {
      redirect('/dashboard');
    }

    return getMockUser('admin');
  }

  const user = await requireAuth();

  if (!(await isAdmin())) {
    redirect('/dashboard');
  }

  return user;
}

/**
 * Result type for requireAdminUser — discriminated union.
 * Routes check `authorized` and return `response` on failure.
 */
export type AdminAuthResult =
  | { authorized: true; userId: string; user: User }
  | {
      authorized: false;
      response: NextResponse<unknown>;
      userId: string | null;
    };

/**
 * Authenticate and authorize an admin user for API route handlers.
 * Combines getCurrentUser() + null-check + checkUserAdminStatus() in one call.
 * Returns a discriminated union so the caller can early-return on failure.
 *
 * Usage:
 * ```ts
 * const auth = await requireAdminUser();
 * if (!auth.authorized) return auth.response;
 * // auth.userId and auth.user are now available
 * ```
 */
export async function requireAdminUser(
  requestId?: string
): Promise<AdminAuthResult> {
  const normalizedRequestId = requestId?.trim() || undefined;
  let user: User | null = null;
  try {
    user = await getCurrentUser();
  } catch (authError) {
    serverInstance.error('getCurrentUser() fehlgeschlagen', {
      requestId: normalizedRequestId,
      error: authError instanceof Error ? authError.message : 'Unknown error',
    });
  }

  const userId = user?.id ?? null;

  if (!userId || !user) {
    return {
      authorized: false,
      userId: null,
      response: createErrorResponse(
        'Authentifizierung erforderlich',
        ErrorCodes.UNAUTHORIZED,
        normalizedRequestId,
        401
      ),
    };
  }

  const isAdminUser = await checkUserAdminStatus(user);
  if (!isAdminUser) {
    serverInstance.warning('Admin-Zugriff verweigert', {
      userId,
      requestId: normalizedRequestId,
    });
    return {
      authorized: false,
      userId,
      response: createErrorResponse(
        'Admin-Berechtigung erforderlich',
        ErrorCodes.FORBIDDEN,
        normalizedRequestId,
        403
      ),
    };
  }

  return { authorized: true, userId, user };
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
