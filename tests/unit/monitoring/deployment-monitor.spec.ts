vi.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/request-analytics', () => ({
  analytics: {
    trackEvent: vi.fn(),
  },
}));

vi.mock('@/lib/monitoring/deployment-alerts', () => ({
  deploymentAlerts: {
    evaluateHealthChecks: vi.fn(),
  },
}));

type MonitorInternals = {
  checkDatabase: () => Promise<unknown>;
  checkAuthentication: () => Promise<unknown>;
  checkStripe: () => Promise<unknown>;
  checkAnalytics: () => Promise<unknown>;
};

function createPassingCheck(name: string) {
  return {
    name,
    status: 'pass' as const,
    responseTime: 1,
    lastChecked: '2026-04-20T00:00:00.000Z',
  };
}

function stubNonRollbarChecks(monitor: MonitorInternals) {
  jest
    .spyOn(monitor, 'checkDatabase')
    .mockResolvedValue(createPassingCheck('database'));
  jest
    .spyOn(monitor, 'checkAuthentication')
    .mockResolvedValue(createPassingCheck('authentication'));
  jest
    .spyOn(monitor, 'checkStripe')
    .mockResolvedValue(createPassingCheck('stripe'));
  jest
    .spyOn(monitor, 'checkAnalytics')
    .mockResolvedValue(createPassingCheck('analytics'));
}

describe('DeploymentMonitor Rollbar health', () => {
  const originalEnv = process.env;
  const rollbarPrefixes = [
    'ROLLBAR_HEMERA_SERVER_TOKEN',
    'ROLLBAR_SERVER_TOKEN',
    'ROLLBAR_AITHER_SERVER_TOKEN',
  ];
  type TestableMonitor = MonitorInternals &
    InstanceType<
      typeof import('@/lib/monitoring/deployment-monitor').DeploymentMonitor
    >;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
    for (const key of Object.keys(process.env)) {
      if (
        rollbarPrefixes.some(
          prefix => key === prefix || key.startsWith(`${prefix}_`)
        )
      ) {
        delete process.env[key];
      }
    }
    delete process.env.ROLLBAR_ENABLED;
    delete process.env.NEXT_PUBLIC_ROLLBAR_ENABLED;
    delete process.env.NEXT_PUBLIC_DISABLE_ROLLBAR;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('returns warn when development opt-in is missing', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
      'valid-token-with-sufficient-length-12345';

    const { DeploymentMonitor } = await import(
      '@/lib/monitoring/deployment-monitor'
    );
    const monitor = new DeploymentMonitor() as TestableMonitor;
    stubNonRollbarChecks(monitor);

    const result = await monitor.performHealthChecks();

    expect(result.rollbar.status).toBe('warn');
    expect(result.rollbar.details).toEqual(
      expect.objectContaining({
        reason:
          'Development-Umgebung nicht aktiviert (ROLLBAR_ENABLED=1 fehlt)',
        configured: true,
      })
    );
  });

  it('returns warn when Rollbar is explicitly disabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
      'valid-token-with-sufficient-length-12345';
    process.env.ROLLBAR_ENABLED = '0';

    const { DeploymentMonitor } = await import(
      '@/lib/monitoring/deployment-monitor'
    );
    const monitor = new DeploymentMonitor() as TestableMonitor;
    stubNonRollbarChecks(monitor);

    const result = await monitor.performHealthChecks();

    expect(result.rollbar.status).toBe('warn');
    expect(result.rollbar.details).toEqual(
      expect.objectContaining({
        reason: 'Explizit deaktiviert',
        configured: false,
      })
    );
  });

  it('returns fail when no Rollbar token is configured', async () => {
    process.env.NODE_ENV = 'production';

    const { DeploymentMonitor } = await import(
      '@/lib/monitoring/deployment-monitor'
    );
    const monitor = new DeploymentMonitor() as TestableMonitor;
    stubNonRollbarChecks(monitor);

    const result = await monitor.performHealthChecks();

    expect(result.rollbar.status).toBe('fail');
    expect(result.rollbar.details).toEqual(
      expect.objectContaining({
        reason: 'Server-Token nicht konfiguriert',
        configured: false,
      })
    );
  });

  it('returns pass for production with a valid token', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ROLLBAR_HEMERA_SERVER_TOKEN =
      'valid-token-with-sufficient-length-12345';

    const { DeploymentMonitor } = await import(
      '@/lib/monitoring/deployment-monitor'
    );
    const monitor = new DeploymentMonitor() as TestableMonitor;
    stubNonRollbarChecks(monitor);

    const result = await monitor.performHealthChecks();

    expect(result.rollbar.status).toBe('pass');
    expect(result.rollbar.details).toEqual(
      expect.objectContaining({
        provider: 'rollbar',
        configured: true,
        environment: 'production',
      })
    );
  });
});