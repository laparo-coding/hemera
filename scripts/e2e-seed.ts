/**
 * E2E Test Seed Script
 *
 * This script seeds the E2E test database (PostgreSQL) with minimal test data.
 *
 * SAFETY: This script includes production database protection to prevent
 * accidental data loss if misconfigured to point at production.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import {
  createE2ECourseData,
  createE2ELocationData,
} from '../lib/testing/e2e-course-fixtures.js';
import {
  getDatabaseEnvironmentInfo,
  guardDestructiveOperation,
} from '../lib/db/production-guard.js';

// Validate we're using the E2E database (PostgreSQL in CI, or local test DB)
const databaseUrl = process.env.DATABASE_URL || '';
if (!databaseUrl) {
  console.error('🚨 ERROR: DATABASE_URL is not set');
  process.exit(1);
}

// Block production URLs
if (
  databaseUrl.includes('vercel-storage.com') ||
  databaseUrl.includes('pooler.supabase') ||
  databaseUrl.includes('neon.tech')
) {
  console.error('🚨 SAFETY ERROR: E2E seed must NOT run against production!');
  console.error(`   Current DATABASE_URL looks like production.`);
  process.exit(1);
}

// Create PG pool and Prisma client with adapter (required for Prisma 7)
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting E2E seed...');
  console.log(`📍 Database: ${getDatabaseEnvironmentInfo()}`);

  // Additional guard - will throw if somehow connected to production
  guardDestructiveOperation('e2e-seed.ts: deleteMany(booking)');
  guardDestructiveOperation('e2e-seed.ts: deleteMany(course)');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.course.deleteMany();
  await prisma.location.deleteMany();

  const location = await prisma.location.create({
    data: createE2ELocationData(
      'Test-Location fuer E2E-Laeufe mit produktionsnahen Kursdaten.'
    ),
  });

  const courses = await prisma.course.createMany({
    data: createE2ECourseData(location.id),
  });

  console.log(`✅ Created ${courses.count} E2E courses`);

  // Verify
  const publishedCount = await prisma.course.count({
    where: { isPublished: true },
  });
  console.log(`📊 Published courses: ${publishedCount}`);
}

main()
  .then(() => {
    console.log('✅ E2E seed completed successfully');
  })
  .catch(e => {
    console.error('❌ E2E seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
