/**
 * Fix Grundkurs price: 300 Cent → 30000 Cent (= 300 €)
 *
 * Run with: source .env.local && npx tsx scripts/fix-grundkurs-price.ts
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

console.log(
  'Using accelerateUrl:',
  `${process.env.PRISMA_ACCELERATE_URL?.slice(0, 40)}...`
);

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
});

async function main() {
  // Aktuellen Preis anzeigen
  const before = await prisma.course.findUnique({
    where: { slug: 'grundkurs' },
    select: { title: true, price: true },
  });
  console.log(
    'Vorher:',
    before?.title,
    '- Preis:',
    before?.price,
    'Cent =',
    (before?.price || 0) / 100,
    '€'
  );

  // Preis auf 30000 Cent (= 300 €) setzen
  const updated = await prisma.course.update({
    where: { slug: 'grundkurs' },
    data: { price: 30000 },
  });
  console.log(
    'Nachher:',
    updated.title,
    '- Preis:',
    updated.price,
    'Cent =',
    updated.price / 100,
    '€'
  );

  await prisma.$disconnect();
}

main();
