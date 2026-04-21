# Database Protection System

## Overview

This document describes the production database protection system implemented to prevent
accidental data loss from destructive operations like `deleteMany()`, `migrate reset`, etc.

## Incident Background

On **2025-12-22**, the production database was accidentally wiped. The root cause was that the
`prisma/seed.ts` script relied solely on `NODE_ENV === 'development'` to guard destructive
operations. This check is insufficient because:

1. `NODE_ENV` is often not set in local development environments
2. Build processes may set `NODE_ENV=production` unexpectedly
3. Environment variable handling varies across shells and terminals

## Protection Layers

### 1. Production Guard Utility (`lib/db/production-guard.ts`)

A centralized utility that detects production databases using multiple signals:

```typescript
import {
  guardDestructiveOperation,
  isSafeForDestructiveOperations,
  getDatabaseEnvironmentInfo,
} from '@/lib/db/production-guard';
```

#### Detection Signals

The guard checks for:

1. **DATABASE_URL patterns** - Known production hosts:
   - `db.prisma.io`, `prisma-data.net` (Prisma Postgres)
   - `neon.tech` (Neon)
   - `supabase.co` (Supabase)
   - `railway.app`, `planetscale.com`, `amazonaws.com`, etc.

2. **VERCEL_ENV** - Vercel's environment indicator
3. **NODE_ENV** - Traditional check (as additional signal, not sole check)
4. **Negative match** - If DATABASE_URL doesn't match safe patterns (localhost, file:, etc.)

#### Safe Patterns

These are considered safe for destructive operations:
- `localhost`, `127.0.0.1`, `::1`
- `file:` (SQLite)
- `.local` domains
- `postgres:` (Docker container hostname)

### 2. Protected Scripts

#### `prisma/seed.ts`

```typescript
if (isSafeForDestructiveOperations()) {
  guardDestructiveOperation('seed.ts: deleteMany(booking)');
  await prisma.booking.deleteMany();
  // ...
} else {
  console.log('⚠️ Skipping data deletion - production database detected');
  // Only upsert operations (safe)
}
```

#### `scripts/e2e-seed.ts`

- Enforces SQLite-only (`file:` URLs)
- Exits with error if DATABASE_URL is not SQLite
- Additional guard check even for SQLite

### 3. NPM Scripts Protection

| Script                  | Behavior                                   |
| ----------------------- | ------------------------------------------ |
| `npm run db:seed`       | Runs `db:check-env` first, then seeds      |
| `npm run db:migrate`    | Runs `db:check-env` first                  |
| `npm run db:reset`      | **DISABLED** - Shows error message         |
| `npm run db:reset:force`| Requires `ALLOW_DESTRUCTIVE_DB_OPS=true`   |
| `npm run db:check-env`  | Shows current database environment status  |

## Override Mechanism

For intentional destructive operations on production (e.g., migrations during deployment),
set the environment variable:

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true npm run db:reset:force
```

⚠️ **WARNING**: Only use this if you absolutely know what you're doing!

## Usage Examples

### Check Current Environment

```bash
npm run db:check-env
```

Output for production:
```
🔍 Database Environment Check
──────────────────────────────────────────────────

Status: 🔴 PRODUCTION DATABASE (postgres://1fac...@db.prisma.io:5432/postgres)

Detection reasons:
  • DATABASE_URL contains production host: db.prisma.io
  • DATABASE_URL does not match any known safe/local patterns

⚠️  WARNING: Destructive operations (deleteMany, truncate)
   will be BLOCKED on this database.
```

### Safe Development Workflow

```bash
# Start local PostgreSQL
docker-compose up -d postgres

# Set local DATABASE_URL
export DATABASE_URL="postgresql://localhost:5432/hemera_dev"

# Now safe to run destructive operations
npm run db:seed
npm run db:migrate
```

### E2E Testing (Always SQLite)

```bash
DATABASE_URL="file:./test.db" npm run test:e2e
```

## Best Practices

1. **Never use production DATABASE_URL locally** - Use separate development databases
2. **Always run `db:check-env` before manual operations** - Verify you're on the right database
3. **Use `db:deploy` for production** - It only applies pending migrations, never resets
4. **Review CI/CD database URLs** - Ensure they point to the correct environments
5. **Treat course restore as emergency-only** - A course restore is the manual recovery of course and location records after real data loss or corruption; it repopulates the database and must not be part of normal development or deployment flows. Placeholder catalogs are hardcoded or seeded runtime course lists, and automatic restore steps are scripts that silently rehydrate catalog data during seed/reset flows, for example `prisma/seed.ts` or `scripts/reset-courses.ts`. Use the documented restore entrypoints in [docs/ops/database-backup.md](docs/ops/database-backup.md) and [scripts/ops/restore-courses-from-backup.mjs](scripts/ops/restore-courses-from-backup.mjs), and avoid restore operations, placeholder catalogs, and automatic restore steps during normal workflows.

## Adding Protection to New Scripts

```typescript
import {
  guardDestructiveOperation,
  isSafeForDestructiveOperations,
} from '../lib/db/production-guard.js';

// Option 1: Throw if production
guardDestructiveOperation('myScript: deleteAll');

// Option 2: Conditional execution
if (isSafeForDestructiveOperations()) {
  // Destructive operations here
}
```

## Related Files

- [lib/db/production-guard.ts](../../lib/db/production-guard.ts) - Core protection logic
- [prisma/seed.ts](../../prisma/seed.ts) - Protected seed script
- [scripts/e2e-seed.ts](../../scripts/e2e-seed.ts) - E2E seed with SQLite enforcement
- [scripts/db-check-env.ts](../../scripts/db-check-env.ts) - Environment check script
