import { prisma } from '@/lib/db/prisma';

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
        date: new Date('2025-12-10T10:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'nachhaltigkeit-business',
        title: 'Nachhaltigkeit im Business',
        description: 'Strategien für nachhaltigen Erfolg im Unternehmen.',
        price: 120,
        currency: 'EUR',
        capacity: 15,
        date: new Date('2025-12-12T14:00:00Z'),
        isPublished: true,
      },
      {
        slug: 'gesund-arbeiten-homeoffice',
        title: 'Gesund arbeiten im Homeoffice',
        description: 'Tipps für mehr Wohlbefinden und Produktivität zuhause.',
        price: 90,
        currency: 'EUR',
        capacity: 25,
        date: new Date('2025-12-15T16:00:00Z'),
        isPublished: true,
      },
    ],
  });
  console.log('Kurse wurden zurückgesetzt und neu angelegt.');
}

main().finally(() => prisma.$disconnect());
