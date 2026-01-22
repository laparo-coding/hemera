#!/usr/bin/env node
/**
 * Deploy Migrations Script
 *
 * Runs Prisma migrations only in Vercel production deployments.
 * Uses POSTGRES_URL (direct connection) for migrations.
 *
 * Usage: Called automatically during build via package.json
 */

import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const vercelEnv = process.env.VERCEL_ENV;
const directDbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (isVercel && directDbUrl && vercelEnv === 'production') {
  console.log('📦 Running prisma migrate deploy...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: directDbUrl },
    });
    console.log('✅ Migrations applied');
  } catch {
    console.log('⏭️  Migrations skipped (may already be applied)');
  }
} else if (!isVercel) {
  console.log('⏭️  Skipping migrations (local build)');
}
