/**
 * Prisma Client Configuration
 *
 * Uses Prisma Accelerate for connection pooling and edge optimization.
 * Compatible with Prisma Postgres (db.prisma.io).
 */

import { PrismaClient } from '@prisma/client';

// Global reference to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Create and configure PrismaClient instance
 *
 * Prisma 7 with engine type "client" requires accelerateUrl.
 * PRISMA_ACCELERATE_URL is used for runtime with connection pooling.
 * DATABASE_URL is used for Prisma CLI operations (migrations, db push).
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    // Prisma 7 requires accelerateUrl for client engine
    accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
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
}
