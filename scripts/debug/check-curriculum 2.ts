/**
 * Debug script to check curriculum data in database
 */

import { prisma } from '../../lib/db/prisma.js';

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, curriculum: true },
    take: 3,
  });

  console.log('📋 Kurse in der Datenbank:');
  for (const course of courses) {
    const hasCurriculum = course.curriculum !== null;
    const curriculumLength = Array.isArray(course.curriculum)
      ? course.curriculum.length
      : 0;
    console.log(
      `  - ${course.title}: ${hasCurriculum ? `${curriculumLength} Module` : 'Kein Curriculum'}`
    );

    if (hasCurriculum && Array.isArray(course.curriculum)) {
      const modules = course.curriculum as Array<{
        day: number;
        title: string;
      }>;
      for (const mod of modules) {
        console.log(`      Tag ${mod.day}: ${mod.title}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
