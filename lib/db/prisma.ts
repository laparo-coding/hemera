/**
 * Prisma Client Configuration
 *
 * Uses Prisma Accelerate for connection pooling and edge optimization in production.
 * Falls back to PG adapter for tests/CI when Accelerate is not available.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Global reference to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

/**
 * Create and configure PrismaClient instance
 *
 * Prisma 7 with engine type "client" requires accelerateUrl for production.
 * For tests/CI (when PRISMA_ACCELERATE_URL is not set), we use PG adapter.
 */
function createPrismaClient(): PrismaClient {
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

  // If accelerateUrl is available, use Prisma Accelerate (production)
  if (accelerateUrl) {
    return new PrismaClient({
      accelerateUrl,
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // For tests/CI without Accelerate, use PG adapter with direct connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Either PRISMA_ACCELERATE_URL or DATABASE_URL must be set');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Reuse client in development to prevent connection exhaustion
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect from database
 * Used in tests and graceful shutdown
 */
export async function closeDb(): Promise<void> {
  await prisma.$disconnect();
  if (globalForPrisma.pool) {
    await globalForPrisma.pool.end();
  }
}
