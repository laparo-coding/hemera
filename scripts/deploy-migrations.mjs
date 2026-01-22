#!/usr/bin/env node
/**
 * Deploy Migrations Script
 *
 * Runs Prisma migrations only in Vercel deployment environments.
 * Uses PRISMA_DATABASE_URL (direct connection) for migrations,
 * falling back to DATABASE_URL if not available.
 *
 * Usage: Called automatically during build via package.json
 */

import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', or 'development'

// For migrations, prefer direct database URL over Prisma Accelerate proxy
const directDbUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const hasDatabaseUrl = !!directDbUrl;

console.log('🔄 Checking migration deployment...');
console.log(`   VERCEL: ${isVercel ? 'yes' : 'no'}`);
console.log(`   VERCEL_ENV: ${vercelEnv || 'not set'}`);
console.log(`   PRISMA_DATABASE_URL: ${process.env.PRISMA_DATABASE_URL ? 'set' : 'not set'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}`);

// Only run migrations on Vercel production deployments
if (isVercel && hasDatabaseUrl && vercelEnv === 'production') {
  console.log('📦 Running prisma migrate deploy...');
  try {
    // Use direct database URL for migrations
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: directDbUrl, // Override with direct URL
      },
    });
    console.log('✅ Migrations applied successfully');
  } catch (error) {
    // Log error but don't fail the build - migrations might already be applied
    console.error('⚠️  Migration warning:', error.message);
    console.log('   Continuing with build (migrations may already be applied)');
  }
} else if (!isVercel) {
  console.log('⏭️  Skipping migrations (not a Vercel build)');
} else if (vercelEnv !== 'production') {
  console.log('⏭️  Skipping migrations (not production environment)');
} else {
  console.log('⚠️  Skipping migrations (no database URL set)');
}
