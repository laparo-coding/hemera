#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';

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
    // Preview DBs (Neon/Vercel) may use self-signed certs; allow override via env.
    // In production, set DB_SSL_REJECT_UNAUTHORIZED=1 (default) to enforce verification.
    ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== '0' },
  });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
    console.log(JSON.stringify({ ok: true, schema }));
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
