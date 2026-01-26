/**
 * Seed Curriculum Data Script
 *
 * Populates existing courses with sample curriculum data.
 * Run with: npx dotenvx run -- npx tsx scripts/seed-curriculum.ts
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db/prisma.js';

// Sample curriculum data for a typical 2-day medical training course
const SAMPLE_CURRICULUM = [
  {
    id: 'day-1',
    day: 1,
    title: 'Tag 1: Grundlagen',
    topics: [
      {
        id: 'day1-topic1',
        timeRange: '09:00 - 10:30',
        title: 'Einführung und Überblick',
      },
      {
        id: 'day1-topic2',
        timeRange: '10:45 - 12:15',
        title: 'Theoretische Grundlagen',
      },
      {
        id: 'day1-topic3',
        timeRange: '13:15 - 14:45',
        title: 'Praktische Demonstration',
      },
      {
        id: 'day1-topic4',
        timeRange: '15:00 - 16:30',
        title: 'Hands-on Training am Simulator',
      },
    ],
  },
  {
    id: 'day-2',
    day: 2,
    title: 'Tag 2: Vertiefung',
    topics: [
      {
        id: 'day2-topic1',
        timeRange: '09:00 - 10:30',
        title: 'Fortgeschrittene Techniken',
      },
      {
        id: 'day2-topic2',
        timeRange: '10:45 - 12:15',
        title: 'Fallstudien und Analyse',
      },
      {
        id: 'day2-topic3',
        timeRange: '13:15 - 14:45',
        title: 'Praxisübungen unter Anleitung',
      },
      {
        id: 'day2-topic4',
        timeRange: '15:00 - 16:30',
        title: 'Abschlussprüfung und Zertifizierung',
      },
    ],
  },
];

async function main() {
  console.log('🔍 Suche Kurse ohne Curriculum...');

  // Find all courses without curriculum data
  // Use OR to catch both JSON null and database NULL values
  const coursesWithoutCurriculum = await prisma.course.findMany({
    where: {
      OR: [
        { curriculum: { equals: Prisma.JsonNull } },
        { curriculum: { equals: Prisma.DbNull } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  console.log(
    `📋 Gefunden: ${coursesWithoutCurriculum.length} Kurse ohne Curriculum`
  );

  if (coursesWithoutCurriculum.length === 0) {
    console.log('✅ Alle Kurse haben bereits Curriculum-Daten.');
    return;
  }

  // Update each course with sample curriculum
  for (const course of coursesWithoutCurriculum) {
    console.log(`📝 Aktualisiere: ${course.title} (${course.slug})`);

    await prisma.course.update({
      where: { id: course.id },
      data: {
        curriculum: SAMPLE_CURRICULUM,
      },
    });
  }

  console.log(
    `✅ ${coursesWithoutCurriculum.length} Kurse mit Curriculum-Daten aktualisiert.`
  );
}

main()
  .catch(error => {
    console.error('❌ Fehler beim Seeden:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
