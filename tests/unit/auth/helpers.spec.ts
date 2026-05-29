/**
 * Auth Helpers Tests
 * Tests for authentication utility functions
 */

import type { User } from '@clerk/nextjs/server';

// Store the original env values
const originalEnvValues = {
  DISABLE_CLERK_SERVER_AUTH: process.env.DISABLE_CLERK_SERVER_AUTH,
  E2E_TEST: process.env.E2E_TEST,
  E2E_ADMIN: process.env.E2E_ADMIN,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL: process.env.VERCEL,
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
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}));

const mockCookiesGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
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
    vi.clearAllMocks();
    mockCurrentUser.mockReset();
    mockCookiesGet.mockReset();
    mockCookiesGet.mockReturnValue(undefined);
    // Reset environment variables to simulate real auth environment
    delete process.env.DISABLE_CLERK_SERVER_AUTH;
    delete process.env.E2E_TEST;
    delete process.env.E2E_ADMIN;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'test';
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
    it('should return mock user when DISABLE_CLERK_SERVER_AUTH is set', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';

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

    it('should return mock user when DISABLE_CLERK_SERVER_AUTH is set for requireAuth', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';

      const user = await requireAuth();

      expect(user).toBeDefined();
      expect(user.id).toBe('e2e_mock_user');
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });

    it('should return true for isAuthenticated in mock environment', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false for isAdmin in disabled-Clerk user mode', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it('should redirect non-admin users away from admin-only guards in disabled-Clerk mode', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';

      await expect(requireAdmin()).rejects.toThrow('REDIRECT:/dashboard');
    });

    it('should return mock admin user when explicit admin mock mode is enabled', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';
      process.env.E2E_ADMIN = '1';

      const result = await isAdmin();
      const user = await requireAdmin();

      expect(result).toBe(true);
      expect(user).toBeDefined();
      expect(user.publicMetadata?.role).toBe('admin');
    });

    it('should not fall through to Clerk on explicit bypass outside the test runtime', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';
      process.env.NODE_ENV = 'production';

      const user = await requireAuth();

      expect(user.id).toBe('e2e_mock_user');
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });

    it('should honor mock role cookie outside jest-style auth mode when bypass is enabled', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL_ENV;
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === 'hemera-e2e-role') {
          return { value: 'admin' };
        }

        return undefined;
      });

      const result = await isAdmin();
      const user = await requireAdmin();

      expect(result).toBe(true);
      expect(user.publicMetadata?.role).toBe('admin');
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });

    it('should allow explicit bypass in local preview-mode dev without hosted Vercel runtime', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'preview';
      delete process.env.VERCEL;
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === 'hemera-e2e-role') {
          return { value: 'admin' };
        }

        return undefined;
      });

      const user = await requireAdmin();

      expect(user.publicMetadata?.role).toBe('admin');
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });

    it('should ignore the mock role cookie on hosted Vercel preview deployments', async () => {
      process.env.DISABLE_CLERK_SERVER_AUTH = '1';
      process.env.NODE_ENV = 'development';
      process.env.VERCEL_ENV = 'preview';
      process.env.VERCEL = '1';
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === 'hemera-e2e-role') {
          return { value: 'admin' };
        }

        return undefined;
      });

      const user = await requireAuth();

      expect(user.id).toBe('e2e_mock_user');
      expect(user.publicMetadata?.role).toBe('user');
      expect(mockCurrentUser).not.toHaveBeenCalled();
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

    it('in test environment, isAdmin defaults to non-admin mock role', async () => {
      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it('in test environment, requireAdmin redirects without explicit admin mock role', async () => {
      await expect(requireAdmin()).rejects.toThrow('REDIRECT:/dashboard');
    });

    it('in test environment, requireAdmin returns mock admin user with explicit admin mock role', async () => {
      process.env.E2E_ADMIN = '1';

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
