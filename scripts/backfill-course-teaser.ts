/**
 * Backfill script: Move first sentence of course description to teaser field
 *
 * Usage: npx tsx scripts/backfill-course-teaser.ts
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

import { prisma } from '../lib/db/prisma';

function extractFirstSentence(text: string): string {
  // Match first sentence ending with . ! or ?
  // Handle common abbreviations like "z.B.", "bzw.", "Dr.", "ca."
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  const firstMatch = match?.[1];
  if (firstMatch) {
    return firstMatch.trim();
  }
  // If no sentence ending found, return first 150 chars with ellipsis
  if (text.length > 150) {
    return `${text.substring(0, 147).trim()}...`;
  }
  return text.trim();
}

async function main() {
  console.log('🔄 Backfilling course teasers from descriptions...\n');

  const courses = await prisma.course.findMany({
    where: {
      description: { not: null },
      teaser: null, // Only update courses without teaser
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  console.log(`Found ${courses.length} courses to update\n`);

  let updated = 0;
  let skipped = 0;

  for (const course of courses) {
    if (!course.description) {
      console.log(`⏭️  Skipping "${course.title}" - no description`);
      skipped++;
      continue;
    }

    const teaser = extractFirstSentence(course.description);

    await prisma.course.update({
      where: { id: course.id },
      data: { teaser },
    });

    console.log(`✅ "${course.title}"`);
    console.log(`   Teaser: ${teaser}\n`);
    updated++;
  }

  console.log('---');
  console.log(`✅ Updated: ${updated} courses`);
  console.log(`⏭️  Skipped: ${skipped} courses`);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
