// Test setup for Jest

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll } from '@jest/globals';
import dotenv from 'dotenv';

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
        dotenv.config({ path: p });
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

beforeAll(async () => {
  // If DATABASE_URL is now provided (e.g., via env files or CI secrets), use it as-is.
  if (process.env.DATABASE_URL) {
    return;
  }

  // Step 2: Start ephemeral Postgres with Testcontainers
  try {
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
    try {
      // Prefer using the project's db:seed script (which uses ts-node), fallback to prisma db seed
      execSync('npm run db:seed', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: connectionUri },
      });
    } catch (_err) {
      // If npm script fails, fallback to direct prisma seed
      execSync('npx prisma db seed', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: connectionUri },
      });
    }
  } catch (err) {
    // Provide a helpful error message and rethrow to fail fast
    console.error(
      '\nFailed to provision a test Postgres database. Either:\n' +
        '- Set DATABASE_URL to a reachable Postgres URL, or\n' +
        '- Provide an .env.test or .env.local with DATABASE_URL, or\n' +
        '- Install & run Docker, since tests can auto-start Postgres via Testcontainers.\n'
    );
    throw err;
  }
});

afterAll(async () => {
  // Stop container if we started one
  if (container && typeof container.stop === 'function') {
    await container.stop();
  }

  // Defensive: Analytics-Scheduler stoppen, falls er in einem Test manuell gestartet wurde
  try {
    const { stopRequestAnalyticsScheduler } =
      await import('../lib/analytics/request-analytics');
    stopRequestAnalyticsScheduler();
  } catch {
    // optional best-effort
  }
});
