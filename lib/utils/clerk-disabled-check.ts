/**
 * Utility for handling Clerk-disabled mode in E2E tests and CI environments
 * When NEXT_PUBLIC_DISABLE_CLERK=1, APIs should gracefully fall back to test behavior
 */

/**
 * Check if Clerk is disabled in the current environment
 * Used during E2E tests and CI to avoid flaky Clerk authentication
 */
export function isClerkDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';
}

/**
 * Check if running in E2E test mode
 */
export function isE2ETestMode(): boolean {
  return process.env.E2E_TEST === '1';
}

/**
 * Create a mock Clerk user for testing purposes
 * Used when Clerk is disabled to allow API routes to function in E2E environments
 */
export interface MockClerkUser {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddress?: {
    emailAddress: string;
  };
}

export function createMockClerkUser(userId: string): MockClerkUser {
  const mockEmail = `test-user-${userId}@hemera-e2e.test`;
  return {
    id: userId,
    emailAddresses: [{ emailAddress: mockEmail }],
    firstName: 'E2E',
    lastName: 'TestUser',
    primaryEmailAddress: {
      emailAddress: mockEmail,
    },
  };
}

/**
 * Generate a deterministic test user ID for E2E tests
 * Uses a fixed prefix to ensure the same user ID across test runs
 */
export function getE2ETestUserId(): string {
  return 'test-user-e2e-001';
}
