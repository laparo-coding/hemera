import { defineConfig, devices } from '@playwright/test';

const hasExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const webServerCommand = process.env.PW_WEB_SERVER_COMMAND || 'npm run dev';
const reuseExistingServer =
  !process.env.CI && process.env.PW_REUSE_EXISTING_SERVER === '1';
const allowRemoteE2ESeed =
  process.env.ALLOW_REMOTE_E2E_SEED === '1' ||
  process.env.ALLOW_REMOTE_E2E_SEED === 'true';

function hasLocalDatabaseTarget() {
  const databaseUrl = process.env.DATABASE_URL?.toLowerCase() || '';

  if (!databaseUrl) {
    return false;
  }

  const hasLocalHostname = (() => {
    try {
      const parsedUrl = new URL(databaseUrl);

      return (
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname === '::1' ||
        parsedUrl.hostname.endsWith('.local')
      );
    } catch {
      return false;
    }
  })();

  return (
    hasLocalHostname ||
    // Cover local Docker Compose service hosts with and without credentials.
    ['file:', '://postgres:', '://db:', '@postgres:', '@db:'].some(pattern =>
      databaseUrl.includes(pattern)
    )
  );
}

// Intentional: derived from hasExternalBase, hasLocalDatabaseTarget(), and
// allowRemoteE2ESeed so seed specs can read the same decision cross-module.
const enableLocalDbSeed =
  !hasExternalBase && (hasLocalDatabaseTarget() || allowRemoteE2ESeed);
// Intentional cross-module side effect: seed specs read this flag during config load.
process.env.PLAYWRIGHT_ENABLE_LOCAL_DB_SEED = enableLocalDbSeed ? '1' : '0';
const e2eEnvAssignments = [
  'E2E_TEST=1',
  'DISABLE_CLERK_SERVER_AUTH=1',
  'NEXT_PUBLIC_E2E_TEST=1',
  'NEXT_PUBLIC_DISABLE_CLERK=1',
  'NEXT_PUBLIC_DISABLE_ROLLBAR=1',
];
const bypassToken =
  process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_BYPASS;
const extraHTTPHeaders = bypassToken
  ? {
      'x-vercel-protection-bypass': bypassToken,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : undefined;
const productionSmokeSpec = /production-smoke\.spec\.ts/;
const authSetupSpec = /auth-setup\.ts/;
const seedSpec = /seed\.spec\.ts/;
const adminSpecs = /admin-.*\.spec\.ts/;
const performanceSpecs = /(performance|dashboard-performance)\.spec\.ts/;
const authUserSpecs = [
  /authentication\.spec\.ts/,
  /authorization\.spec\.ts/,
  /dashboard(?:-mobile|-sections)?\.spec\.ts/,
  /checkout\.spec\.ts/,
  /invoice-download\.spec\.ts/,
];
const sharedProjectIgnores = [productionSmokeSpec, authSetupSpec, seedSpec];
const incognitoDesktopChrome = {
  ...devices['Desktop Chrome'],
  launchOptions: {
    args: ['--incognito'],
  },
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Lower worker count locally to reduce DB pool contention and flakiness
  workers: process.env.CI ? 4 : 3,
  retries: process.env.CI ? 2 : 1, // Add retry for local development
  timeout: 60000, // Increase test timeout to 60 seconds
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30000, // Increase action timeout
    navigationTimeout: 60000, // Increase navigation timeout
  },
  webServer: hasExternalBase
    ? undefined
    : {
        command: `cross-env ${e2eEnvAssignments.join(' ')} ${webServerCommand}`,
        port: 3000,
        // Reusing an arbitrary local dev server can drop the E2E env flags
        // and silently run the auth/dashboard suite against the wrong app mode.
        reuseExistingServer,
        timeout: 180_000,
      },
  projects: [
    {
      name: 'seed',
      testMatch: seedSpec,
    },
    // Auth setup project - creates authenticated state for tests requiring login
    {
      name: 'setup',
      testMatch: authSetupSpec,
    },
    // Public browser - for anonymous flows and read-only diagnostics
    {
      name: 'public',
      use: incognitoDesktopChrome,
      testIgnore: [
        ...sharedProjectIgnores,
        adminSpecs,
        performanceSpecs,
        ...authUserSpecs,
      ],
    },
    // Authenticated user browser - keeps the existing project name for CLI compatibility
    {
      name: 'chromium-auth',
      use: incognitoDesktopChrome,
      dependencies: enableLocalDbSeed ? ['seed', 'setup'] : ['setup'],
      testMatch: authUserSpecs,
      testIgnore: [...sharedProjectIgnores, adminSpecs, performanceSpecs],
    },
    // Authenticated admin browser - isolates admin flakes from general user flows
    {
      name: 'auth-admin',
      use: incognitoDesktopChrome,
      dependencies: enableLocalDbSeed ? ['seed', 'setup'] : ['setup'],
      testMatch: adminSpecs,
      testIgnore: sharedProjectIgnores,
    },
    // Performance project - separates timing-sensitive assertions from functional flows
    {
      name: 'performance',
      use: incognitoDesktopChrome,
      dependencies: enableLocalDbSeed ? ['seed'] : [],
      testMatch: performanceSpecs,
      testIgnore: sharedProjectIgnores,
    },
    // Production smoke tests - scheduled daily, read-only
    {
      name: 'production-smoke',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PRODUCTION_URL || 'https://hemera.academy',
      },
      testMatch: productionSmokeSpec,
    },
  ],
});
