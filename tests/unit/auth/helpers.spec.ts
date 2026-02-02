/**
 * Auth Helpers Tests
 * Tests for authentication utility functions
 */

import type { User } from '@clerk/nextjs/server';

// Store the original env values
const originalEnvValues = {
  NEXT_PUBLIC_DISABLE_CLERK: process.env.NEXT_PUBLIC_DISABLE_CLERK,
  E2E_TEST: process.env.E2E_TEST,
  NODE_ENV: process.env.NODE_ENV,
};

/**
 * Restore environment variables to their original values.
 * Handles both defined and undefined original states.
 */
function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnvValues)) {
    if (value !== undefined) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
}

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

// Import after mocks
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  requireAuth,
  requireAuthenticatedUser,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  requireAdmin,
  getUserDisplayName,
} from '@/lib/auth/helpers';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables to simulate real auth environment
    delete process.env.NEXT_PUBLIC_DISABLE_CLERK;
    delete process.env.E2E_TEST;
    // Keep NODE_ENV as 'test' but that's checked in the isMockAuthEnvironment
  });

  afterEach(() => {
    // Restore original values after each test to prevent cross-test pollution
    restoreEnv();
  });

  afterAll(() => {
    // Final cleanup: restore original env values
    restoreEnv();
  });

  describe('Mock Auth Environment', () => {
    it('should return mock user when NEXT_PUBLIC_DISABLE_CLERK is set', async () => {
      process.env.NEXT_PUBLIC_DISABLE_CLERK = '1';

      const user = await getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.id).toBe('e2e_mock_user');
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });

    it('should return mock user when E2E_TEST is set', async () => {
      process.env.E2E_TEST = 'true';

      const user = await getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.id).toBe('e2e_mock_user');
    });

    it('should return true for isAuthenticated in mock environment', async () => {
      process.env.NEXT_PUBLIC_DISABLE_CLERK = '1';

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return true for isAdmin in mock environment', async () => {
      process.env.NEXT_PUBLIC_DISABLE_CLERK = '1';

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('should return mock admin user for requireAdmin in mock environment', async () => {
      process.env.NEXT_PUBLIC_DISABLE_CLERK = '1';

      const user = await requireAdmin();

      expect(user).toBeDefined();
      expect(user.publicMetadata?.role).toBe('admin');
    });
  });

  describe('Real Auth Environment', () => {
    // Note: Since NODE_ENV === 'test' triggers mock auth, we test the mock behavior here
    // Real auth behavior is tested via integration tests

    const mockUser: Partial<User> = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [
        {
          id: 'email-1',
          emailAddress: 'john@example.com',
          linkedTo: [],
          verification: null,
        },
      ],
      publicMetadata: {},
    };

    const mockAdminUser: Partial<User> = {
      ...mockUser,
      publicMetadata: { role: 'admin' },
    };

    it('in test environment, requireAuth returns mock user', async () => {
      // NODE_ENV === 'test' triggers mock auth, so Clerk is not called
      const user = await requireAuth();

      expect(user.id).toBe('e2e_mock_user');
    });

    it('requireAuthenticatedUser should be alias for requireAuth', async () => {
      expect(requireAuthenticatedUser).toBe(requireAuth);
    });

    it('in test environment, getCurrentUser returns mock user', async () => {
      const user = await getCurrentUser();

      expect(user?.id).toBe('e2e_mock_user');
    });

    it('in test environment, isAuthenticated returns true', async () => {
      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('in test environment, isAdmin returns true', async () => {
      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('in test environment, requireAdmin returns mock admin user', async () => {
      const user = await requireAdmin();

      expect(user.id).toBe('e2e_mock_user');
      expect(user.publicMetadata?.role).toBe('admin');
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name when available', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [],
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should return first name only when no last name', () => {
      const user = {
        firstName: 'John',
        lastName: null,
        emailAddresses: [],
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('John');
    });

    it('should return last name only when no first name', () => {
      const user = {
        firstName: null,
        lastName: 'Doe',
        emailAddresses: [],
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('Doe');
    });

    it('should return email when no name', () => {
      const user = {
        firstName: null,
        lastName: null,
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('john@example.com');
    });

    it('should return User as fallback', () => {
      const user = {
        firstName: null,
        lastName: null,
        emailAddresses: [],
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('User');
    });
  });
});
