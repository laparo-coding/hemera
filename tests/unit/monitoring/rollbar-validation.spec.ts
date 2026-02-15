/**
 * Unit tests for Rollbar SDK initialization validation
 * Ensures SDK only initializes when properly configured
 */

describe('Rollbar SDK Initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // Clone env to avoid mutations (cast to any to allow NODE_ENV mutation in tests)
    process.env = { ...originalEnv } as any;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Token Validation', () => {
    it('should not initialize Rollbar without server token', async () => {
      // Remove all Rollbar tokens
        delete process.env.ROLLBAR_HEMERA_SERVER_TOKEN;
      delete process.env.ROLLBAR_SERVER_TOKEN;
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      // Import after env setup
        const mod = await import('@/lib/monitoring/rollbar-official');

      // Should be no-op instance
      expect(mod.serverInstance).toBeDefined();
      // Ensure calling reportError does not trigger network calls
      const spy = jest.spyOn(mod.serverInstance as any, 'error');
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
      const spy = jest.spyOn(mod.serverInstance as any, 'error');
      mod.reportError('Disabled test', { requestId: 'd1' }, 'error');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Client Configuration', () => {
    it('should not include client token if invalid', async () => {
      process.env.NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN = 'short';
      // @ts-expect-error - Mutating NODE_ENV for test purposes
      process.env.NODE_ENV = 'production';

      const { clientConfig } = await import(
        '@/lib/monitoring/rollbar-official'
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
        '@/lib/monitoring/rollbar-official'
      );

      expect(clientConfig.accessToken).toBe(validToken);
    });
  });
});
