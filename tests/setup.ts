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

globalThis.jest = vi as typeof globalThis.jest;

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
(() => {
  if (!process.env.DATABASE_URL) {
    const root = process.cwd();
    const envCandidates = [
      path.join(root, '.env.test'),
      path.join(root, '.env.local'),
      path.join(root, '.env'),
    ];
    for (const p of envCandidates) {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p, quiet: true });
        if (process.env.DATABASE_URL) break;
      }
    }
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
