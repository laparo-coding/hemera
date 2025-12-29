/**
 * E2E Test Seed Script
 *
 * This script is used for E2E testing with SQLite.
 * For Prisma 7, we need the better-sqlite3 adapter.
 *
 * SAFETY: This script includes production database protection to prevent
 * accidental data loss if misconfigured to point at production.
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import {
  getDatabaseEnvironmentInfo,
  guardDestructiveOperation,
} from '../lib/db/production-guard.js';

// Validate we're using SQLite (E2E tests should ALWAYS use SQLite)
const databaseUrl = process.env.DATABASE_URL || 'file:./test.db';
if (!databaseUrl.startsWith('file:')) {
  console.error('🚨 SAFETY ERROR: E2E seed must use SQLite (file: URL)');
  console.error(`   Current DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
  console.error('   Set DATABASE_URL=file:./test.db for E2E tests');
  process.exit(1);
}

// Prisma 7 requires an adapter for all databases
const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

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
  });
