import { closeDb, prisma } from '../lib/db/prisma';

// Use shared Prisma instance

async function main() {
  await prisma.booking.deleteMany();
  await prisma.course.deleteMany();
  await prisma.course.createMany({
    data: [
      {
        slug: 'motivation-finden-halten',
        title: 'Motivation finden und halten',
        description: 'Lerne, wie du deine Motivation langfristig stärkst.',
        price: 100,
        currency: 'EUR',
        capacity: 20,
        startDate: new Date('2025-12-10T00:00:00Z'),
        startTime: new Date('2025-12-10T10:00:00Z'),
        endTime: new Date('2025-12-10T14:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'nachhaltigkeit-business',
        title: 'Nachhaltigkeit im Business',
        description: 'Strategien für nachhaltigen Erfolg im Unternehmen.',
        price: 120,
        currency: 'EUR',
        capacity: 15,
        startDate: new Date('2025-12-12T00:00:00Z'),
        startTime: new Date('2025-12-12T14:00:00Z'),
        endTime: new Date('2025-12-12T18:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'gesund-arbeiten-homeoffice',
        title: 'Gesund arbeiten im Homeoffice',
        description: 'Tipps für mehr Wohlbefinden und Produktivität zuhause.',
        price: 90,
        currency: 'EUR',
        capacity: 25,
        startDate: new Date('2025-12-15T00:00:00Z'),
        startTime: new Date('2025-12-15T16:00:00Z'),
        endTime: new Date('2025-12-15T20:00:00Z'),
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
