#!/usr/bin/env node
/**
 * Deploy Migrations Script
 *
 * Runs Prisma migrations only in Vercel deployment environments
 * where DATABASE_URL is available.
 *
 * Usage: Called automatically during build via package.json
 */

import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

console.log('🔄 Checking migration deployment...');
console.log(`   VERCEL: ${isVercel ? 'yes' : 'no'}`);
console.log(`   DATABASE_URL: ${hasDatabaseUrl ? 'set' : 'not set'}`);

if (isVercel && hasDatabaseUrl) {
  console.log('📦 Running prisma migrate deploy...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('✅ Migrations applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
} else if (!isVercel) {
  console.log('⏭️  Skipping migrations (not a Vercel build)');
} else {
  console.log('⚠️  Skipping migrations (DATABASE_URL not set)');
}
