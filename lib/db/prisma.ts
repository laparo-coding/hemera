import { PrismaClient } from '@prisma/generated';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

function withSchemaParam(urlStr: string, schema?: string): string {
  try {
    const url = new URL(urlStr);

    // Decide whether to enforce SSL: only for remote hosts (Neon/Vercel/etc.)
    const host = url.hostname?.toLowerCase();
    const isLocalHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === 'postgres' || // GitHub Actions service hostname
      host.endsWith('.local');

    if (!url.searchParams.has('sslmode') && !isLocalHost) {
      url.searchParams.set('sslmode', 'require');
    }

    if (schema) {
      url.searchParams.set('schema', schema);
    }

    // In E2E/Dev-Tests erlauben wir längere Pool-Zeitüberschreitung, um Flakiness zu vermeiden
    if (
      process.env.E2E_TEST === 'true' &&
      !url.searchParams.has('pool_timeout')
    ) {
      // Sekunden
      url.searchParams.set('pool_timeout', '30');
    }

    return url.toString();
  } catch {
    // Fallback to previous behavior if URL parsing fails
    if (!schema) return urlStr;
    const hasQuery = urlStr.includes('?');
    const sep = hasQuery ? '&' : '?';
    return `${urlStr}${sep}schema=${encodeURIComponent(schema)}`;
  }
}

// Resolve schema in the following order:
// 1) Explicit env overrides: PREVIEW_SCHEMA or PR_SCHEMA
// 2) Optional (feature-flagged) Vercel Preview auto-detection when ENABLE_PREVIEW_SCHEMA=1
const runtimeSchemaFromEnv =
  process.env.PREVIEW_SCHEMA || process.env.PR_SCHEMA;
const vercelEnv = process.env.VERCEL_ENV;
const vercelPrId = process.env.VERCEL_GIT_PULL_REQUEST_ID;
const enablePreviewSchema = process.env.ENABLE_PREVIEW_SCHEMA === '1';
const inferredSchema =
  !runtimeSchemaFromEnv &&
  enablePreviewSchema &&
  vercelEnv === 'preview' &&
  vercelPrId
    ? `hemera_pr_${vercelPrId}`
    : undefined;
const runtimeSchema = runtimeSchemaFromEnv || inferredSchema;

const runtimeDbUrl = process.env.DATABASE_URL
  ? withSchemaParam(process.env.DATABASE_URL, runtimeSchema)
  : undefined;

const connectionString = runtimeDbUrl ?? process.env.DATABASE_URL ?? '';
const sslEnabled =
  process.env.PGSSL === '1' || process.env.PGSSL === 'true' ? true : undefined;
const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

export async function closeDb(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
