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

  // Create minimal test courses (matching production slugs)
  const courses = await prisma.course.createMany({
    data: [
      {
        title: 'Grundlagen der Gehaltsverhandlung',
        description:
          'Lerne die fundamentalen Strategien und Techniken für erfolgreiche Gehaltsverhandlungen.',
        slug: 'grundkurs',
        price: 14900,
        currency: 'EUR',
        capacity: 25,
        startDate: new Date('2026-01-15T00:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T14:00:00Z'),
        isPublished: true,
      },
      {
        title: 'Fortgeschrittene Verhandlungsstrategien',
        description:
          'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen zu meistern.',
        slug: 'fortgeschrittene',
        price: 29900,
        currency: 'EUR',
        capacity: 20,
        startDate: new Date('2026-02-20T00:00:00Z'),
        startTime: new Date('2026-02-20T14:00:00Z'),
        endTime: new Date('2026-02-20T18:00:00Z'),
        isPublished: true,
      },
      {
        title: 'Masterclass: Exzellenz in Verhandlungen',
        description:
          'Meistere die Kunst der Verhandlung auf höchstem Niveau und erreiche deine anspruchsvollsten Ziele.',
        slug: 'masterclass',
        price: 49900,
        currency: 'EUR',
        capacity: 12,
        startDate: new Date('2026-03-28T00:00:00Z'),
        startTime: new Date('2026-03-28T10:00:00Z'),
        endTime: new Date('2026-03-28T16:00:00Z'),
        isPublished: true,
      },
    ],
  });

  console.log(`✅ Created ${courses.count} courses`);

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
