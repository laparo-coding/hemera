import { closeDb, prisma } from '../lib/db/prisma.js';
import {
  getDatabaseEnvironmentInfo,
  guardDestructiveOperation,
  isSafeForDestructiveOperations,
} from '../lib/db/production-guard.js';

async function main() {
  const safeForDestructiveOperations = isSafeForDestructiveOperations();

  // Log current database environment for visibility
  console.log(`\n📍 Database Environment: ${getDatabaseEnvironmentInfo()}\n`);

  if (!safeForDestructiveOperations) {
    console.log('ℹ️  Production-Datenbank erkannt. Seed greift nicht in Kursdaten ein.');
    console.log('   Development nutzt die Development-Datenbank, Production die Produktionsdatenbank.');
    console.log('   CourseSummaryAssets werden in dieser Umgebung ebenfalls nicht automatisch geschrieben.\n');
    return;
  }

  const courses = await prisma.course.findMany({
    where: { isPublished: true, isNonPublic: false },
    select: { id: true, title: true, slug: true },
    orderBy: { startDate: 'asc' },
    take: 3,
  });

  if (courses.length === 0) {
    console.log('ℹ️  Keine veröffentlichten Kurse in der aktuellen Datenbank gefunden.');
    console.log('   Kein automatischer Restore. Manueller Restore bleibt nur für Notfälle vorgesehen.');
    return;
  }

  console.log('🧹 Bereinige abgeleitete Testdaten in sicherer Umgebung...');
  guardDestructiveOperation('seed.ts: DELETE bookings');
  await prisma.$executeRaw`DELETE FROM bookings`;
  guardDestructiveOperation('seed.ts: DELETE course_summary_assets');
  await prisma.$executeRaw`DELETE FROM course_summary_assets`;
  console.log('✅ Abgeleitete Testdaten bereinigt\n');

  console.log(`📚 Verwende ${courses.length} Kurse direkt aus der aktuellen Datenbank.`);

  // --------------------------------------------
  // Seed CourseSummaryAssets (Mux videos for testing)
  // Using Mux public test assets:
  // https://docs.mux.com/guides/data/debug-test-environment
  // --------------------------------------------
  console.log('🎥 Seeding CourseSummaryAssets...');

  // Use courses from the active database for summary asset seeding
  const muxTestPlaybackIds = [
    'xyw0xyx00D02TUYCpZjG6aKnHqI2tYTG00', // Mux test asset 1
    'a4nOgmxGWg6gULfcBbAa00gXyfJwzaFJ02', // Mux test asset 2
    '9HuqMWPnpf00fxSwEvtB00K01PkKTq6x9X01', // Mux test asset 3
  ];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
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
    `   ✔ Created ${courses.length} CourseSummaryAssets`
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
