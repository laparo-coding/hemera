import { closeDb, prisma } from '../lib/db/prisma';

// Automatic course resets are disabled. Use the emergency restore script manually if needed.

async function main() {
  const courseCount = await prisma.course.count();
  console.log(`Aktuelle Kurse in der verbundenen Datenbank: ${courseCount}`);
  console.log(
    'Automatischer Kurs-Reset ist deaktiviert. ' +
      'Nutze den manuellen Notfall-Restore nur bei echtem Datenverlust.'
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
