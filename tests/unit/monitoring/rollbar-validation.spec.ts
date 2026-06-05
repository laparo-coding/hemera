/**
 * Unit tests for Rollbar SDK initialization validation
 * Ensures SDK only initializes when properly configured
 */

describe('Rollbar SDK Initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules();
    // Clone env to avoid mutations (cast to any to allow NODE_ENV mutation in tests)
    process.env = { ...originalEnv } as any;
    delete process.env.ROLLBAR_ENABLED;
    delete process.env.NEXT_PUBLIC_ROLLBAR_ENABLED;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Token Validation', () => {
    it('should prefer the newest suffixed server token from Vercel integration', async () => {
      for (const key of Object.keys(process.env)) {
        if (
          key.startsWith('ROLLBAR_HEMERA_SERVER_TOKEN') ||
          key.startsWith('ROLLBAR_SERVER_TOKEN')
        ) {
          delete process.env[key];
        }
      }

      process.env.ROLLBAR_HEMERA_SERVER_TOKEN_1769716944 =
        'older-invalid-token';
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN_1769717269 =
        'newest-valid-server-token-with-sufficient-length-12345';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { rollbarConfig } = await import('@/lib/monitoring/rollbar-official');

      expect(rollbarConfig.accessToken).toBe(
        'newest-valid-server-token-with-sufficient-length-12345'
      );
    });

    it('should not initialize Rollbar without server token', async () => {
      // Remove all Rollbar tokens (including Vercel-Rollbar integration suffixed keys)
      for (const key of Object.keys(process.env)) {
        if (
          key.startsWith('ROLLBAR_HEMERA_SERVER_TOKEN') ||
          key.startsWith('ROLLBAR_SERVER_TOKEN')
        ) {
          delete process.env[key];
        }
      }
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      // Import after env setup
        const mod = await import('@/lib/monitoring/rollbar-official');

      // Should be no-op instance
      expect(mod.serverInstance).toBeDefined();
      // Ensure calling reportError does not trigger network calls
      const spy = vi.spyOn(mod.serverInstance as any, 'error');
      mod.reportError('TestError', { requestId: 't1' }, 'error');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should not initialize Rollbar with invalid token (too short)', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN = 'short';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { serverInstance } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      // Should be no-op instance due to invalid token
      expect(serverInstance).toBeDefined();
    });

    it('should initialize Rollbar with valid token', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { serverInstance } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      expect(serverInstance).toBeDefined();
      expect(typeof serverInstance.error).toBe('function');
    });
  });

  describe('Environment-based Disabling', () => {
    it('should prefer ROLLBAR_SERVER_ROOT when configured', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      process.env.ROLLBAR_SERVER_ROOT = './custom-rollbar-root';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { rollbarConfig } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      expect(rollbarConfig.root).toBe('./custom-rollbar-root');
    });

    it('should fall back to process.cwd() when ROLLBAR_SERVER_ROOT is unset', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      delete process.env.ROLLBAR_SERVER_ROOT;
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { rollbarConfig } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      expect(rollbarConfig.root).toBe(process.cwd());
    });

    it('should disable Rollbar in test mode', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'test';

      const { serverInstance } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      // Should be no-op instance in test mode
      expect(serverInstance).toBeDefined();
    });

    it('should disable Rollbar in E2E mode', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      process.env.E2E_TEST = '1';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { serverInstance } = await import(
        '@/lib/monitoring/rollbar-official'
      );

      // Should be no-op instance in E2E mode
      expect(serverInstance).toBeDefined();
    });

    it('should respect explicit disable flags', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      process.env.NEXT_PUBLIC_ROLLBAR_ENABLED = '0';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const mod = await import('@/lib/monitoring/rollbar-official');
      // Should be no-op instance when explicitly disabled
      expect(mod.serverInstance).toBeDefined();
      const spy = vi.spyOn(mod.serverInstance as any, 'error');
      mod.reportError('Disabled test', { requestId: 'd1' }, 'error');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should keep development disabled without explicit opt-in', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      delete process.env.JEST_WORKER_ID;
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'development';

      const mod = await import('@/lib/monitoring/rollbar-official');
      const clientMod = await import('@/lib/monitoring/rollbar-client-config');

      expect(mod.rollbarConfig.enabled).toBe(false);
      expect(clientMod.clientConfig.enabled).toBe(false);
    });

    it('should enable development when explicitly opted in', async () => {
      process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
        'valid-token-with-sufficient-length-12345';
      process.env.ROLLBAR_ENABLED = '1';
      delete process.env.JEST_WORKER_ID;
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'development';

      const mod = await import('@/lib/monitoring/rollbar-official');

      expect(mod.rollbarConfig.enabled).toBe(true);
    });
  });

  describe('Client Configuration', () => {
    it('should not include client token if invalid', async () => {
      process.env.NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN = 'short';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { clientConfig } = await import(
        '@/lib/monitoring/rollbar-client-config'
      );

      expect(clientConfig.accessToken).toBeUndefined();
      expect(clientConfig.enabled).toBe(false);
    });

    it('should include client token if valid', async () => {
      const validToken = 'valid-client-token-with-sufficient-length-12345';
      process.env.NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN =
        validToken;
        process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
          'valid-server-token-with-sufficient-length-12345';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { clientConfig } = await import(
        '@/lib/monitoring/rollbar-client-config'
      );

      expect(clientConfig.accessToken).toBe(validToken);
    });
  });
});
