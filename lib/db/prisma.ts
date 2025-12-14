import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Check if DATABASE_URL is SQLite (file:// protocol)
const isSqlite = process.env.DATABASE_URL?.startsWith('file:');

function withSchemaParam(urlStr: string, schema?: string): string {
  // SQLite URLs don't support schema params
  if (urlStr.startsWith('file:')) {
    return urlStr;
  }
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

// For SQLite (E2E tests), we use better-sqlite3 adapter
// For PostgreSQL (production), we use pg adapter
let prismaClient: PrismaClient;
let closeDbFn: () => Promise<void>;

if (isSqlite) {
  // Dynamic import to avoid bundling sqlite3 in production
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const sqliteAdapter = new PrismaBetterSqlite3({
    url: connectionString || 'file:./test.db',
  });
  prismaClient = new PrismaClient({ adapter: sqliteAdapter });
  closeDbFn = async () => {
    await prismaClient.$disconnect();
  };
} else {
  // Create pool only if DATABASE_URL is available
  // During Next.js build, DATABASE_URL might not be set, so we use a fallback
  // that will fail gracefully at runtime if actual DB access is attempted
  const pool = new Pool({
    connectionString:
      connectionString || 'postgresql://localhost:5432/build_placeholder',
    ssl: sslEnabled ? { rejectUnauthorized: true } : undefined,
  });

  const adapter = new PrismaPg(pool);
  prismaClient = new PrismaClient({ adapter });
  closeDbFn = async () => {
    await prismaClient.$disconnect();
    await pool.end();
  };
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? prismaClient;

export async function closeDb(): Promise<void> {
  await closeDbFn();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
