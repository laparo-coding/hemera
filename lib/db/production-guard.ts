/**
 * Production Database Guard
 *
 * This module provides safeguards against accidentally running destructive
 * operations (deleteMany, truncate, drop) on production databases.
 *
 * The problem: On 2025-12-22, the production database was wiped because
 * NODE_ENV checks alone are insufficient - Vercel sets NODE_ENV=production
 * during build, but local environments often don't set it properly.
 *
 * This guard uses multiple signals to detect production:
 * 1. DATABASE_URL patterns (prisma.io, neon.tech, supabase.co, etc.)
 * 2. VERCEL_ENV === 'production'
 * 3. NODE_ENV === 'production' (as additional signal)
 * 4. Explicit ALLOW_DESTRUCTIVE_DB_OPS=true override for intentional operations
 */

// Known production database hosts
const PRODUCTION_DB_PATTERNS = [
  'db.prisma.io',
  'prisma-data.net',
  'accelerate.prisma-data.net',
  'neon.tech',
  'supabase.co',
  'supabase.com',
  'railway.app',
  'cockroachlabs.cloud',
  'planetscale.com',
  'elephantsql.com',
  'heroku.com',
  'amazonaws.com', // RDS
  'azure.com', // Azure DB
  'googlecloud.com', // Cloud SQL
] as const;

// Safe database patterns (local development)
const SAFE_DB_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '::1',
  'file:', // SQLite
  '.local',
  'postgres:', // Local docker container name
] as const;

export interface ProductionCheckResult {
  isProduction: boolean;
  reasons: string[];
  databaseUrl: string;
  canOverride: boolean;
}

/**
 * Check if the current environment is connected to a production database.
 * Returns detailed information about why it's considered production.
 */
export function checkProductionDatabase(): ProductionCheckResult {
  const databaseUrl = process.env.DATABASE_URL || '';
  const reasons: string[] = [];

  // Check explicit override first
  const hasOverride = process.env.ALLOW_DESTRUCTIVE_DB_OPS === 'true';

  // Check Vercel production
  if (process.env.VERCEL_ENV === 'production') {
    reasons.push('VERCEL_ENV is set to production');
  }

  // Check NODE_ENV (less reliable but still a signal)
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.CI &&
    !process.env.E2E_TEST
  ) {
    reasons.push('NODE_ENV is set to production');
  }

  // Check database URL for production patterns
  const urlLower = databaseUrl.toLowerCase();
  for (const pattern of PRODUCTION_DB_PATTERNS) {
    if (urlLower.includes(pattern)) {
      reasons.push(`DATABASE_URL contains production host: ${pattern}`);
      break;
    }
  }

  // Check if it's NOT a safe/local database
  const isSafeDatabase = SAFE_DB_PATTERNS.some(pattern =>
    urlLower.includes(pattern)
  );
  if (!isSafeDatabase && databaseUrl.length > 0) {
    reasons.push('DATABASE_URL does not match any known safe/local patterns');
  }

  // Mask credentials in URL for logging
  const maskedUrl = maskDatabaseUrl(databaseUrl);

  return {
    isProduction: reasons.length > 0 && !hasOverride,
    reasons,
    databaseUrl: maskedUrl,
    canOverride: hasOverride,
  };
}

/**
 * Guard function that throws if attempting destructive operations on production.
 * Use this before any deleteMany, truncate, or similar operations.
 */
export function guardDestructiveOperation(operationName: string): void {
  const check = checkProductionDatabase();

  if (check.isProduction) {
    const errorMessage = [
      `🚨 PRODUCTION DATABASE PROTECTION ACTIVATED 🚨`,
      ``,
      `Attempted operation: ${operationName}`,
      `Database URL: ${check.databaseUrl}`,
      ``,
      `Reasons this is considered production:`,
      ...check.reasons.map(r => `  • ${r}`),
      ``,
      `To override (DANGEROUS - only for intentional operations):`,
      `  Set ALLOW_DESTRUCTIVE_DB_OPS=true in your environment`,
      ``,
      `If this is a local development database, ensure DATABASE_URL`,
      `points to localhost or a local file.`,
    ].join('\n');

    // biome-ignore lint/suspicious/noConsole: CLI script output for developer safety warnings
    console.error(errorMessage);
    throw new Error(
      `Production database protection: ${operationName} blocked. See console for details.`
    );
  }

  // Log that we're proceeding (for audit trail)
  if (check.canOverride) {
    // biome-ignore lint/suspicious/noConsole: CLI script output for developer safety warnings
    console.warn(
      `⚠️  DESTRUCTIVE OPERATION OVERRIDE: ${operationName} on ${check.databaseUrl}`
    );
    // biome-ignore lint/suspicious/noConsole: CLI script output for developer safety warnings
    console.warn(`   Reasons it would be blocked: ${check.reasons.join(', ')}`);
  }
}

/**
 * Async guard that can be awaited before destructive operations.
 * Adds a small delay to give developers time to Ctrl+C if something looks wrong.
 */
export async function guardDestructiveOperationAsync(
  operationName: string,
  delayMs: number = 0
): Promise<void> {
  guardDestructiveOperation(operationName);

  if (delayMs > 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script output for developer safety warnings
    console.log(
      `⏳ Proceeding with ${operationName} in ${delayMs / 1000}s... (Ctrl+C to abort)`
    );
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Check if we're in a safe environment for destructive operations.
 * Use this for conditional logic instead of throwing.
 */
export function isSafeForDestructiveOperations(): boolean {
  const check = checkProductionDatabase();
  return !check.isProduction || check.canOverride;
}

/**
 * Get a human-readable description of the current database environment.
 */
export function getDatabaseEnvironmentInfo(): string {
  const check = checkProductionDatabase();

  if (check.isProduction) {
    return `🔴 PRODUCTION DATABASE (${check.databaseUrl})`;
  }

  if (check.canOverride) {
    return `🟡 PRODUCTION DATABASE WITH OVERRIDE (${check.databaseUrl})`;
  }

  return `🟢 Development/Test Database (${check.databaseUrl})`;
}

/**
 * Mask sensitive parts of a database URL for safe logging.
 */
function maskDatabaseUrl(url: string): string {
  if (!url) return '(not set)';

  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    if (parsed.username && parsed.username.length > 8) {
      parsed.username = `${parsed.username.substring(0, 4)}...`;
    }
    // Also mask API keys in query params
    for (const [key, value] of parsed.searchParams.entries()) {
      if (
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token')
      ) {
        parsed.searchParams.set(key, `${value.substring(0, 10)}...`);
      }
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, mask the middle portion
    if (url.length > 30) {
      return `${url.substring(0, 15)}...${url.substring(url.length - 10)}`;
    }
    return url;
  }
}
