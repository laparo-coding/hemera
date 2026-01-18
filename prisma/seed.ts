import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import {
  getDatabaseEnvironmentInfo,
  guardDestructiveOperation,
  isSafeForDestructiveOperations,
} from '../lib/db/production-guard.js';

// Create a fresh Prisma client for seeding
// This ensures we use the latest generated client without ESM module caching issues
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for seeding');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to convert old date format to new format
function convertDateToFields(dateStr: string) {
  const date = new Date(dateStr);
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0); // Reset to start of day

  const startTime = new Date(date);

  const endTime = new Date(date);
  endTime.setHours(date.getHours() + 4); // Default 4 hours duration

  return {
    startDate,
    startTime,
    endTime,
  };
}

async function main() {
  // Log current database environment for visibility
  console.log(`\n📍 Database Environment: ${getDatabaseEnvironmentInfo()}\n`);

  // Clear existing data ONLY in safe environments (local development/test)
  // This guard will throw if connected to a production database
  if (isSafeForDestructiveOperations()) {
    console.log('🧹 Clearing existing data (safe environment detected)...');
    guardDestructiveOperation('seed.ts: deleteMany(booking)');
    await prisma.booking.deleteMany();
    guardDestructiveOperation('seed.ts: deleteMany(course)');
    await prisma.course.deleteMany();
    console.log('✅ Existing data cleared\n');
  } else {
    console.log('⚠️  Skipping data deletion - production database detected');
    console.log('   Will only upsert courses (safe operation)\n');
  }

  const seedCourses = [
    {
      title: 'Grundlagen der Gehaltsverhandlung',
      description:
        'Lerne die fundamentalen Strategien und Techniken für erfolgreiche Gehaltsverhandlungen. Perfekt für den Einstieg.',
      slug: 'grundkurs',
      price: 14900,
      currency: 'EUR',
      capacity: 25,
      ...convertDateToFields('2026-01-15T10:00:00Z'),
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
      ...convertDateToFields('2026-02-20T14:00:00Z'),
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
      ...convertDateToFields('2026-03-28T10:00:00Z'),
      isPublished: true,
    },
  ];

  const courses = await Promise.all(
    seedCourses.map(course =>
      prisma.course.upsert({
        where: { slug: course.slug },
        update: {
          title: course.title,
          description: course.description,
          price: course.price,
          currency: course.currency,
          capacity: course.capacity,
          startDate: course.startDate,
          startTime: course.startTime,
          endTime: course.endTime,
          isPublished: course.isPublished,
        },
        create: course,
      })
    )
  );

  // --------------------------------------------
  // Seed CourseSummaryAssets (Mux videos for testing)
  // Using Mux public test assets:
  // https://docs.mux.com/guides/data/debug-test-environment
  // --------------------------------------------
  console.log('🎥 Seeding CourseSummaryAssets...');

  // Use first 3 courses for summary asset seeding
  const coursesWithSummaries = courses.slice(0, 3);
  const muxTestPlaybackIds = [
    'xyw0xyx00D02TUYCpZjG6aKnHqI2tYTG00', // Mux test asset 1
    'a4nOgmxGWg6gULfcBbAa00gXyfJwzaFJ02', // Mux test asset 2
    '9HuqMWPnpf00fxSwEvtB00K01PkKTq6x9X01', // Mux test asset 3
  ];

  for (let i = 0; i < coursesWithSummaries.length; i++) {
    const course = coursesWithSummaries[i];
    const playbackId = muxTestPlaybackIds[i];
    const assetId = `test-asset-${course.id}`;

    // Check if asset already exists for this course
    const existingAsset = await prisma.courseSummaryAsset.findFirst({
      where: { courseId: course.id },
    });

    if (existingAsset) {
      // Update existing
      await prisma.courseSummaryAsset.update({
        where: { id: existingAsset.id },
        data: {
          muxPlaybackId: playbackId,
          muxAssetId: assetId,
          title: `Zusammenfassung: ${course.title}`,
        },
      });
    } else {
      // Create new
      await prisma.courseSummaryAsset.create({
        data: {
          courseId: course.id,
          muxPlaybackId: playbackId,
          muxAssetId: assetId,
          title: `Zusammenfassung: ${course.title}`,
          sortOrder: 0,
        },
      });
    }
  }

  console.log(
    `   ✔ Created ${coursesWithSummaries.length} CourseSummaryAssets`
  );

  // --------------------------------------------
  // CourseParticipation records are now created lazily
  // when a user starts the preparation (not on booking)
  // See: startParticipationAction in lib/actions/participation.ts
  // --------------------------------------------
  console.log(
    '📋 CourseParticipation: Records created on-demand when user starts preparation'
  );

  // Minimal DB connectivity check
  await prisma.$queryRaw`SELECT 1`;
}

main()
  .then(() => {
    console.log('✅ Seed completed successfully');
  })
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
