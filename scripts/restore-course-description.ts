/**
 * Restore course description for "Grundlagen der Gehaltsverhandlung"
 *
 * Usage: npx tsx scripts/restore-course-description.ts
 */

import { closeDb, prisma } from '../lib/db/prisma';

async function main() {
  const originalDescription =
    'Lerne die fundamentalen Strategien und Techniken für erfolgreiche Gehaltsverhandlungen. Perfekt für den Einstieg.';

  const updated = await prisma.course.updateMany({
    where: { slug: 'basisseminar' },
    data: { description: originalDescription },
  });

  console.log(
    '✅ Beschreibung wiederhergestellt für',
    updated.count,
    'Kurs(e)'
  );

  const course = await prisma.course.findFirst({
    where: { slug: 'basisseminar' },
    select: { title: true, description: true },
  });
  console.log('📋 Titel:', course?.title);
  console.log('📋 Description:', course?.description);
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
