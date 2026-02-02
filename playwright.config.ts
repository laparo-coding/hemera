import { defineConfig, devices } from '@playwright/test';

const hasExternalBase = !!process.env.PLAYWRIGHT_BASE_URL;
const webServerCommand = process.env.PW_WEB_SERVER_COMMAND || 'npm run dev';
const e2eEnvPrefix =
  'E2E_TEST=1 NEXT_PUBLIC_DISABLE_CLERK=1 NEXT_PUBLIC_DISABLE_ROLLBAR=1';

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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    // If Vercel preview is SSO-protected, you can bypass protection by providing
    // a token via env VERCEL_PROTECTION_BYPASS (or VERCEL_BYPASS). This will be
    // sent as the required header for all requests, including APIRequestContext.
    extraHTTPHeaders: (() => {
      const token =
        process.env.VERCEL_PROTECTION_BYPASS || process.env.VERCEL_BYPASS;
      return token ? { 'x-vercel-protection-bypass': token } : undefined;
    })(),
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 30000, // Increase action timeout
    navigationTimeout: 60000, // Increase navigation timeout
  },
  webServer: hasExternalBase
    ? undefined
    : {
        command: `${e2eEnvPrefix} ${webServerCommand}`,
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [
    // Auth setup project - creates authenticated state for tests requiring login
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
    },
    // Authenticated browser - uses saved auth state, depends on setup
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
        launchOptions: {
          args: ['--incognito'],
        },
      },
      dependencies: ['setup'],
    },
    // Unauthenticated browser - for public page tests
    {
      name: 'chromium-no-auth',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--incognito'],
        },
      },
    },
    // Default chromium project (legacy compat)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--incognito'],
        },
      },
    },
    // Production smoke tests - scheduled daily, read-only
    {
      name: 'production-smoke',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PRODUCTION_URL || 'https://hemera.academy',
      },
      testMatch: /production-smoke\.spec\.ts/,
    },
  ],
});
