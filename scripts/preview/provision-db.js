#!/usr/bin/env node
/*
  Provision a per-PR preview schema in the existing Postgres DATABASE_URL and run migrations+seed.
  Inputs:
    - DATABASE_URL (env)
    - PR_NUMBER (env) or FALLBACK_SCHEMA
  Output: prints JSON summary { schema, ok }
*/
import { execSync } from 'node:child_process';
import process from 'node:process';
import pg from 'pg';

function withSchemaParam(url, schema) {
  const hasQuery = url.includes('?');
  const sep = hasQuery ? '&' : '?';
  // ensure sslmode=require if not present (safe for Neon/Vercel)
  const ensureSSL = url.includes('sslmode=') ? '' : `${sep}sslmode=require`;
  const sep2 = url.includes('?') || ensureSSL ? '&' : '?';
  return `${url}${ensureSSL}${sep2}schema=${encodeURIComponent(schema)}`;
}

async function main() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(2);
  }
  const pr =
    process.env.PR_NUMBER ||
    process.env.GITHUB_EVENT_NUMBER ||
    process.env.GITHUB_REF_NAME ||
    'local';
  const schema = (process.env.FALLBACK_SCHEMA || `hemera_pr_${pr}`).replace(
    /[^a-zA-Z0-9_]/g,
    '_'
  );
  const client = new pg.Client({
    connectionString: baseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
  } finally {
    await client.end();
  }
  const urlWithSchema = withSchemaParam(baseUrl, schema);
  // Run prisma migrate deploy with overridden DATABASE_URL
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: urlWithSchema },
    });
  } catch (e) {
    console.warn(
      '[provision-db] migrate deploy failed, falling back to prisma db push:',
      e?.message || e
    );
    // Fallback for preview/dev: push the current Prisma schema to the target schema
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: urlWithSchema },
    });
  }
  // Seed (TypeScript) via ts-node ESM loader
  execSync('node --loader ts-node/esm prisma/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: urlWithSchema },
  });
  console.log(JSON.stringify({ ok: true, schema }));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
