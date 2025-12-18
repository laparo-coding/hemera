/**
 * E2E Test Seed Script
 *
 * This script is used for E2E testing with SQLite.
 * For Prisma 7, we need the better-sqlite3 adapter.
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

// Prisma 7 requires an adapter for all databases
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./test.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting E2E seed...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.course.deleteMany();

  // Create minimal test courses
  const courses = await prisma.course.createMany({
    data: [
      {
        title: 'Grundlagen der Persönlichkeitsentwicklung',
        description: 'Entdecken Sie die Basics der persönlichen Entwicklung.',
        slug: 'grundlagen-persoenlichkeitsentwicklung',
        price: 100,
        currency: 'EUR',
        capacity: 20,
        startDate: new Date('2025-11-15T00:00:00Z'),
        startTime: new Date('2025-11-15T10:00:00Z'),
        endTime: new Date('2025-11-15T14:00:00Z'),
        isPublished: true,
      },
      {
        title: 'Selbstvertrauen in 30 Minuten',
        description: 'Schnelle Techniken zur Stärkung Ihres Selbstvertrauens.',
        slug: 'selbstvertrauen-30-minuten',
        price: 100,
        currency: 'EUR',
        capacity: 25,
        startDate: new Date('2025-11-20T00:00:00Z'),
        startTime: new Date('2025-11-20T14:00:00Z'),
        endTime: new Date('2025-11-20T14:30:00Z'),
        isPublished: true,
      },
      {
        title: 'Stressabbau für Anfänger',
        description: 'Einfache Methoden zum Stressabbau.',
        slug: 'stressabbau-anfaenger',
        price: 100,
        currency: 'EUR',
        capacity: 30,
        startDate: new Date('2025-11-25T00:00:00Z'),
        startTime: new Date('2025-11-25T16:00:00Z'),
        endTime: new Date('2025-11-25T20:00:00Z'),
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
