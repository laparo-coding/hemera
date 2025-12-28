import { closeDb, prisma } from '../lib/db/prisma';

// Use shared Prisma instance - Production-identical course data

async function main() {
  await prisma.booking.deleteMany();
  await prisma.course.deleteMany();
  await prisma.course.createMany({
    data: [
      {
        slug: 'grundkurs',
        title: 'Grundlagen der Gehaltsverhandlung',
        description:
          'Lerne die fundamentalen Strategien und Techniken für erfolgreiche Gehaltsverhandlungen. Perfekt für den Einstieg.',
        price: 14900,
        currency: 'EUR',
        capacity: 25,
        startDate: new Date('2026-01-15T00:00:00Z'),
        startTime: new Date('2026-01-15T10:00:00Z'),
        endTime: new Date('2026-01-15T14:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'fortgeschrittene',
        title: 'Fortgeschrittene Verhandlungsstrategien',
        description:
          'Vertiefe deine Kenntnisse mit fortgeschrittenen Taktiken und lerne, auch schwierige Situationen zu meistern.',
        price: 29900,
        currency: 'EUR',
        capacity: 20,
        startDate: new Date('2026-02-20T00:00:00Z'),
        startTime: new Date('2026-02-20T14:00:00Z'),
        endTime: new Date('2026-02-20T18:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'masterclass',
        title: 'Masterclass: Exzellenz in Verhandlungen',
        description:
          'Meistere die Kunst der Verhandlung auf höchstem Niveau und erreiche deine anspruchsvollsten Ziele.',
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
  console.log('Kurse wurden zurückgesetzt und neu angelegt.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
