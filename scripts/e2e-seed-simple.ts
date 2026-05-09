/**
 * Simple E2E Test Seed Script for SQLite
 *
 * This script is used for E2E testing with SQLite.
 * It creates deterministic, produktionsnahe Testdaten nur fuer die Testdatenbank.
 */
import { PrismaClient } from '@prisma/client';
import {
  createE2ECourseData,
  createE2ELocationData,
} from '../lib/testing/e2e-course-fixtures';

// For SQLite, we use a simple PrismaClient without adapters
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  console.log('🌱 Starting simple E2E seed...');

  await prisma.booking.deleteMany();
  await prisma.course.deleteMany();
  await prisma.location.deleteMany();

  const location = await prisma.location.create({
    data: createE2ELocationData('SQLite E2E-Test-Location'),
  });

  const courses = await prisma.course.createMany({
    data: createE2ECourseData(location.id),
  });

  console.log(`✅ Created ${courses.count} SQLite E2E courses`);

  const publishedCount = await prisma.course.count({
    where: { isPublished: true },
  });
  console.log(`📊 Published courses: ${publishedCount}`);
}

main()
  .then(() => {
    console.log('✅ Simple E2E seed completed successfully');
  })
  .catch(e => {
    console.error('❌ Simple E2E seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
