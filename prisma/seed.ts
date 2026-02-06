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
    guardDestructiveOperation('seed.ts: DELETE locations');
    await prisma.$executeRaw`DELETE FROM locations`;
    console.log('✅ Existing data cleared\n');
  } else {
    console.log('⚠️  Skipping data deletion - production database detected');
    console.log('   Will only upsert courses (safe operation)\n');
  }

  // --------------------------------------------
  // Seed Location (matching production data)
  // --------------------------------------------
  console.log('📍 Seeding Location...');
  const locationId = 'seed-location-gartenhotel';
  await prisma.$executeRaw`
    INSERT INTO locations (id, slug, name, description, address, zip_code, city, email, phone, website, image_url, room_image_url, latitude, longitude, created_at, updated_at)
    VALUES (
      ${locationId},
      'gartenhotel-fette-henne',
      'Gartenhotel Fette Henne',
      'Von einem besonderen Ort, der den unterschiedlichen Persönlichkeiten unserer Gäste vollständig gerecht wird. Durch echtes und persönliches Interesse an Dir und Deinem Wohlergehen machen wir unser Zuhause zu Deinem zweiten Zuhause.',
      'Schildsheider Str. 47',
      '40699',
      'Erkrath',
      'gartenhotel@fettehennehotels.de',
      '+49 2104 13830',
      'https://www.gartenhotel-fettehenne.de/',
      'https://fwdhpoytjheqeqjq.public.blob.vercel-storage.com/location-images/exterior/1767006581959-6220ag.webp',
      'https://fwdhpoytjheqeqjq.public.blob.vercel-storage.com/location-images/room/1767006585847-0cuoc.webp',
      51.2052406,
      6.9653751,
      NOW(),
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      address = EXCLUDED.address,
      zip_code = EXCLUDED.zip_code,
      city = EXCLUDED.city,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      website = EXCLUDED.website,
      image_url = EXCLUDED.image_url,
      room_image_url = EXCLUDED.room_image_url,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      updated_at = NOW()
  `;
  console.log('   ✔ Location "Gartenhotel Fette Henne" seeded');

  const seedCourses = [
    {
      title: 'Gehe zielsicher durch dein Gehaltsgespräch',
      description:
        'Du führst nicht dein erstes Gehaltsgespräch, aber eine gewisse Unsicherheit verspürst du trotzdem noch, wenn es darum geht, deine Foderungen zu artikulieren. Du wünscht dir diese Art von Leichtigkeit mit der du sonst Gespräche führt, aber etwas hält dich zurück. Du fragst dich, ob dein Gegenüber merkt, worum es dir geht. Wenn du jetzt dein Ziel erreichen möchtest, braucht es Klarheit und eine souveränes Auftreten.\nDieser Kurs ist so strukturiert, dass du deine Stärke findest, während du dich und die anderen Teilnehmerinnen in verschiedenen Gesprächssituationen erlebst. Du gewinnt durch Gesprächspraxis die Sicherheit, deine Zeile erreichen',
      teaser:
        'Du führst nicht dein erstes Gehaltsgespräch, aber eine gewisse Unsicherheit verspürst du trotzdem noch, wenn es darum geht, deine Foderungen zu artikulieren.',
      slug: 'grundkurs',
      price: 30000,
      currency: 'EUR',
      capacity: 6,
      startDate: new Date('2026-06-19T22:00:00.000Z'),
      startTime: new Date('2025-12-28T08:00:00.000Z'),
      endTime: new Date('2026-01-12T17:15:00.000Z'),
      isPublished: true,
      instructor: 'Andreas',
      level: 'BEGINNER' as const,
      thumbnailUrl:
        'https://fwdhpoytjheqeqjq.public.blob.vercel-storage.com/course-images/1766998295102-ppry5-thumbnail.webp',
      curriculum: [
        {
          id: 'day-1',
          day: 1,
          title: 'Grundlagen der Verhandlung',
          topics: [
            { id: 't1', timeRange: '09:00 - 09:30', title: 'Stelle dich und deinen Plan vor' },
            { id: 't2', timeRange: '09:30 - 10:00', title: 'So gehst du ein Gespräch rein, so nicht' },
            { id: 't3', timeRange: '10:00 - 10:30', title: 'Videoanalyse 1' },
            { id: 't4', timeRange: '10:30 - 11:00', title: 'Videoanalyse 2' },
            { id: 't5', timeRange: '11:00 - 11:15', title: 'Pause' },
            { id: 't6', timeRange: '11:15 - 11:45', title: 'Videoanalyse 4' },
            { id: 't7', timeRange: '11:45 - 12:15', title: 'Videoanalyse 5' },
            { id: 't8', timeRange: '12:15 - 12:45', title: 'Videoanalyse 6' },
            { id: 't9', timeRange: '12:45 - 13:30', title: 'Mittagspause' },
            { id: 't10', timeRange: '13:30 - 14:00', title: 'Verhandele dein Ergebnis, nicht deine Gefühle' },
            { id: 't11', timeRange: '14:30 - 15:00', title: 'Gehaltsgespräch 1' },
            { id: 't12', timeRange: '15:00 - 15:30', title: 'Gehaltsgespräch 2' },
            { id: 't13', timeRange: '15:30 - 16:00', title: 'Gehaltsgespräch 3' },
            { id: 't14', timeRange: '16:00 - 16:15', title: 'Pause' },
            { id: 't15', timeRange: '16:15 - 16:45', title: 'Gehaltsgespräch 4' },
            { id: 't16', timeRange: '16:45 - 17:15', title: 'Gehaltsgespräch 5' },
            { id: 't17', timeRange: '17:15 - 17:45', title: 'Gehaltsgespräch 6' },
            { id: 't18', timeRange: '17:45 - 18:15', title: 'Bereite dich vor. Ab jetzt zählt es' },
          ],
        },
      ],
      locationId: locationId,
    },
    {
      title: 'Fortgeschrittene Verhandlungsstrategien',
      description:
        'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen zu meistern.',
      teaser:
        'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen zu meistern.',
      slug: 'fortgeschrittene',
      price: 50000,
      currency: 'EUR',
      capacity: 12,
      startDate: new Date('2026-09-18T22:00:00.000Z'),
      startTime: new Date('2025-12-28T08:00:00.000Z'),
      endTime: new Date('2025-12-28T16:00:00.000Z'),
      isPublished: true,
      instructor: 'Andreas',
      level: 'INTERMEDIATE' as const,
      thumbnailUrl:
        'https://fwdhpoytjheqeqjq.public.blob.vercel-storage.com/course-images/1766998946755-ojg6wr-thumbnail.webp',
      curriculum: null,
      locationId: locationId,
    },
    {
      title: 'Masterclass: Exzellenz in Verhandlungen',
      description:
        'Meistere die Kunst der Verhandlung auf höchstem Niveau und erreiche deine anspruchsvollsten Ziele.',
      teaser:
        'Meistere die Kunst der Verhandlung auf höchstem Niveau und erreiche deine anspruchsvollsten Ziele.',
      slug: 'masterclass',
      price: 70000,
      currency: 'EUR',
      capacity: 7,
      startDate: new Date('2027-01-22T23:00:00.000Z'),
      startTime: new Date('2025-12-28T08:00:00.000Z'),
      endTime: new Date('2025-12-28T17:00:00.000Z'),
      isPublished: true,
      instructor: 'Andreas',
      level: 'ADVANCED' as const,
      thumbnailUrl:
        'https://fwdhpoytjheqeqjq.public.blob.vercel-storage.com/course-images/1766998974161-5cijz7-thumbnail.webp',
      curriculum: null,
      locationId: locationId,
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
      INSERT INTO courses (id, title, description, teaser, slug, price, currency, capacity, start_date, start_time, end_time, is_published, instructor, level, thumbnail_url, curriculum, location_id, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${course.title},
        ${course.description},
        ${course.teaser},
        ${course.slug},
        ${course.price},
        ${course.currency},
        ${course.capacity},
        ${course.startDate},
        ${course.startTime},
        ${course.endTime},
        ${course.isPublished},
        ${course.instructor},
        ${course.level},
        ${course.thumbnailUrl},
        ${curriculumJson}::jsonb,
        ${course.locationId},
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        teaser = EXCLUDED.teaser,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        capacity = EXCLUDED.capacity,
        start_date = EXCLUDED.start_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_published = EXCLUDED.is_published,
        instructor = EXCLUDED.instructor,
        level = EXCLUDED.level,
        thumbnail_url = EXCLUDED.thumbnail_url,
        curriculum = EXCLUDED.curriculum,
        location_id = EXCLUDED.location_id,
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
