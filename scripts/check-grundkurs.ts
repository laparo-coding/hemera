/**
 * Check and fix Grundkurs thumbnailUrl
 */

import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
});

async function main() {
  const course = await prisma.course.findUnique({
    where: { slug: 'grundkurs' },
  });

  console.log('Grundkurs Daten:');
  console.log('  title:', course?.title);
  console.log('  thumbnailUrl:', course?.thumbnailUrl || 'NICHT GESETZT');
  console.log('  instructor:', course?.instructor || 'NICHT GESETZT');
  console.log('  price:', course?.price);

  await prisma.$disconnect();
}

main();
