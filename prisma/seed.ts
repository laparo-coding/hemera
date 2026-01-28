import { Prisma } from '@prisma/client';
import { closeDb, prisma } from '../lib/db/prisma.js';
import {
  getDatabaseEnvironmentInfo,
  guardDestructiveOperation,
  isSafeForDestructiveOperations,
} from '../lib/db/production-guard.js';

// Use shared Prisma instance

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
    // Use raw SQL to avoid Prisma 7.2.0 @map() bug with driver adapters
    guardDestructiveOperation('seed.ts: DELETE bookings');
    await prisma.$executeRaw`DELETE FROM bookings`;
    guardDestructiveOperation('seed.ts: DELETE course_summary_assets');
    await prisma.$executeRaw`DELETE FROM course_summary_assets`;
    guardDestructiveOperation('seed.ts: DELETE courses');
    await prisma.$executeRaw`DELETE FROM courses`;
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
      curriculum: null, // Managed via Admin UI
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
      curriculum: null,
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
      curriculum: null,
    },
  ];

  // Use raw SQL to avoid Prisma 7.2.0 bug with @map() decorator and driver adapters
  // (P2022 ColumnNotFound). Raw SQL bypasses the Prisma Client query compiler.
  // See: https://github.com/prisma/prisma/issues/27357
  for (const course of seedCourses) {
    // Ensure curriculumJson is either null or a valid JSON string
    // Explicitly handle null/undefined to avoid 'null' string or invalid casts
    const curriculumJson =
      course.curriculum != null ? JSON.stringify(course.curriculum) : null;

    await prisma.$executeRaw`
      INSERT INTO courses (id, title, description, slug, price, currency, capacity, start_date, start_time, end_time, is_published, instructor, level, curriculum, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${course.title},
        ${course.description},
        ${course.slug},
        ${course.price},
        ${course.currency},
        ${course.capacity},
        ${course.startDate},
        ${course.startTime},
        ${course.endTime},
        ${course.isPublished},
        'TBD',
        'BEGINNER',
        ${curriculumJson}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        capacity = EXCLUDED.capacity,
        start_date = EXCLUDED.start_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_published = EXCLUDED.is_published,
        curriculum = EXCLUDED.curriculum,
        updated_at = NOW()
    `;
  }

  // Fetch all seeded courses for subsequent operations using Prisma.join for array
  const slugs = seedCourses.map(c => c.slug);
  const courses = await prisma.$queryRaw<
    Array<{ id: string; title: string; slug: string }>
  >`SELECT id, title, slug FROM courses WHERE slug IN (${Prisma.join(slugs)})`;

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
    if (!course || !playbackId) continue;

    const assetId = `test-asset-${course.id}`;
    const title = `Zusammenfassung: ${course.title}`;

    // Use raw SQL insert (we delete all data first, so no conflict handling needed)
    await prisma.$executeRaw`
      INSERT INTO course_summary_assets (id, course_id, mux_playback_id, mux_asset_id, title, sort_order, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${course.id},
        ${playbackId},
        ${assetId},
        ${title},
        0,
        NOW(),
        NOW()
      )
    `;
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
    await closeDb();
  });
