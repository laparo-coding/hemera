/**
 * Prisma Client Configuration
 *
 * Uses Prisma Accelerate for connection pooling and edge optimization in production.
 * Falls back to PG adapter for tests/CI when Accelerate is not available.
 * Supports SQLite for E2E tests via better-sqlite3 adapter.
 */

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Global reference to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

// Lazy-initialized client
let _prismaClient: PrismaClient | undefined;

/**
 * Check if DATABASE_URL is a SQLite file URL
 */
function isSqliteUrl(url: string | undefined): boolean {
  return url?.startsWith('file:') ?? false;
}

/**
 * Create and configure PrismaClient instance
 *
 * Prisma 7 with engine type "client" requires accelerateUrl for production.
 * For tests/CI (when PRISMA_ACCELERATE_URL is not set), we use PG adapter.
 * For E2E tests, we use SQLite with better-sqlite3 adapter.
 */
function createPrismaClient(): PrismaClient {
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
  const databaseUrl = process.env.DATABASE_URL;

  // If accelerateUrl is available, use Prisma Accelerate (production)
  if (accelerateUrl) {
    return new PrismaClient({
      accelerateUrl,
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // For E2E tests with SQLite, use better-sqlite3 adapter
  if (isSqliteUrl(databaseUrl)) {
    const adapter = new PrismaBetterSqlite3({ url: databaseUrl! });
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // For tests/CI without Accelerate, use PG adapter with direct connection
  // During Next.js build (no DB available), we need to return a mock client
  // This allows static page generation without actual DB access
  if (!databaseUrl) {
    // Create a "dummy" pool with placeholder URL - operations will fail at runtime
    // but module import succeeds during build
    const placeholderPool = new Pool({
      connectionString: 'postgresql://placeholder:5432/placeholder',
    });
    globalForPrisma.pool = placeholderPool;
    const adapter = new PrismaPg(placeholderPool);
    return new PrismaClient({
      adapter,
      log: ['error'],
    });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/**
 * Get the Prisma client instance (lazy initialization)
 * This allows DATABASE_URL to be set after module import (e.g., by testcontainers)
 */
function getPrismaClient(): PrismaClient {
  if (!_prismaClient) {
    if (globalForPrisma.prisma) {
      _prismaClient = globalForPrisma.prisma;
    } else {
      _prismaClient = createPrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prismaClient;
      }
    }
  }
  return _prismaClient;
}

// Export a proxy that lazily initializes the client on first property access
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Gracefully disconnect from database
 * Used in tests and graceful shutdown
 */
export async function closeDb(): Promise<void> {
  if (_prismaClient) {
    await _prismaClient.$disconnect();
  }
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
}
