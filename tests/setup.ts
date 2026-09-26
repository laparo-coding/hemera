// Test setup for Vitest

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import dotenv from 'dotenv';
import { afterAll, beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

declare global {
  var jest: typeof vi;
}

globalThis.jest = vi;

// Mock server-only module to prevent errors in test environment
vi.mock('server-only', () => ({}));

// Polyfill focus()/blur() for jsdom to fix MUI FocusTrap errors
// MUI's Unstable_TrapFocus calls nodeToRestore.current.focus() on cleanup,
// but jsdom doesn't consistently implement focus() on all node types.
// We ALWAYS override because jsdom's existing implementation may still fail.
if (typeof window !== 'undefined') {
  HTMLElement.prototype.focus = (): void => {
    // Robust no-op polyfill for jsdom - always available
  };
  HTMLElement.prototype.blur = (): void => {
    // Robust no-op polyfill for jsdom - always available
  };
}

// Polyfill Web APIs for jsdom environment (required by testcontainers and other libraries)
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream =
    ReadableStream as typeof globalThis.ReadableStream;
}
if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream =
    WritableStream as typeof globalThis.WritableStream;
}
if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream =
    TransformStream as typeof globalThis.TransformStream;
}

// Load env files eagerly so that DATABASE_URL is available before test files import PrismaClient
// SECURITY: Only .env.test is loaded automatically. .env.local / .env may contain
// production DATABASE_URLs - loading them here caused a production data wipe
// (E2E tests ran deleteMany against the production database).
(() => {
  if (!process.env.DATABASE_URL) {
    const root = process.cwd();
    const envCandidates = [path.join(root, '.env.test')];
    for (const p of envCandidates) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p, quiet: true });
        if (process.env.DATABASE_URL) break;
      }
    }
  }
})();

// SECURITY GUARD: Refuse to run tests against a production database.
// Tests use deleteMany()/delete() extensively and must never touch production data.
// Override only with explicit ALLOW_TESTS_AGAINST_PRODUCTION=true (not recommended).
(() => {
  const databaseUrl = process.env.DATABASE_URL || '';
  const productionHostPatterns = [
    'db.prisma.io',
    'prisma-data.net',
    'neon.tech',
    'supabase.co',
    'supabase.com',
    'railway.app',
    'cockroachlabs.cloud',
    'planetscale.com',
    'elephantsql.com',
    'heroku.com',
    'amazonaws.com',
    'azure.com',
    'googlecloud.com',
  ];
  const isProductionUrl = productionHostPatterns.some(pattern =>
    databaseUrl.includes(pattern)
  );
  const override = process.env.ALLOW_TESTS_AGAINST_PRODUCTION === 'true';

  if (databaseUrl && isProductionUrl && !override) {
    throw new Error(
      `\n🚨 TEST ABORTED: DATABASE_URL points to a production database!\n` +
        `   Tests perform destructive operations (deleteMany) and would wipe production data.\n` +
        `   DATABASE_URL: ${databaseUrl.replace(/:[^:@/]*@/, ':***@')}\n\n` +
        `   Use a local/test database instead:\n` +
        `   - .env.test with a local DATABASE_URL, or\n` +
        `   - unset DATABASE_URL to let testcontainers start an ephemeral Postgres.\n`
    );
  }
})();

// We lazy import testcontainers to avoid requiring Docker when DATABASE_URL is already provided
interface PostgresContainer {
  getHost: () => string;
  getPort: () => number;
  getUsername: () => string;
  getPassword: () => string;
  getDatabase: () => string;
  stop: () => Promise<unknown>;
}

let container: PostgresContainer | undefined;

// Detect jsdom environment - we skip database setup for DOM-only tests
const isJsdomEnvironment = typeof window !== 'undefined';

beforeAll(async () => {
  // Skip database setup for jsdom tests (React component tests don't need DB)
  if (isJsdomEnvironment) {
    return;
  }

  // If DATABASE_URL is now provided (e.g., via env files or CI secrets), use it as-is.
  if (process.env.DATABASE_URL) {
    return;
  }

  // Step 2: Start ephemeral Postgres with Testcontainers
  // Dynamically import dedicated Postgres module
  const { PostgreSqlContainer } = await import('@testcontainers/postgresql');

  const pg = new PostgreSqlContainer('postgres:16');
  container = await pg.start();

  if (!container) {
    throw new Error('Failed to start container');
  }

  const host = container.getHost();
  const port = container.getPort();
  const username = container.getUsername();
  const password = container.getPassword();
  const database = container.getDatabase();

  // Build a connection string without sslmode, the container runs without SSL
  const connectionUri = `postgresql://${encodeURIComponent(
    username
  )}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

  process.env.DATABASE_URL = connectionUri;

  // Apply Prisma migrations to the fresh database
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: connectionUri },
  });

  // Seed the database (ensure published courses exist for E2E)
  // Note: Seed may fail due to Prisma 7.2.0 bug with @map() and driver adapters
  // (see https://github.com/prisma/prisma/issues/27357)
  // Unit tests should still pass without seed data; only E2E tests require it.
  try {
    // Prefer using the project's db:seed script (which uses ts-node), fallback to prisma db seed
    execSync('npm run db:seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: connectionUri },
    });
  } catch (_seedErr) {
    // Don't fail - unit tests can run without seed data
    // Known Prisma 7.2.0 issue with @map() and driver adapters
    // See: https://github.com/prisma/prisma/issues/27357
    // biome-ignore lint/suspicious/noConsole: intentional warning in test setup
    console.warn(
      '⚠️ Database seeding failed (Prisma @map() bug). Unit tests will run with empty tables.'
    );
  }
});

afterAll(async () => {
  // Stop container if we started one
  if (container && typeof container.stop === 'function') {
    await container.stop();
  }

  // Defensive: Analytics-Scheduler stoppen, falls er in einem Test manuell gestartet wurde
  try {
    const { stopRequestAnalyticsScheduler } = await import(
      '../lib/analytics/request-analytics'
    );
    stopRequestAnalyticsScheduler();
  } catch {
    // optional best-effort
  }
});
