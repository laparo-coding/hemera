import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (!courses.length) {
    console.log('Keine Kurse gefunden. Bitte Seed ausführen.');
  } else {
    console.log('Aktuelle Kurse im System:');
    courses.forEach((course, index) => {
      console.log(
        `${index + 1}. ${course.title} (ID: ${course.id}, slug: ${course.slug}, published: ${course.isPublished})`
      );
    });
  }
} catch (error) {
  console.error('Fehler beim Abrufen der Kurse:', error);
} finally {
  await prisma.$disconnect();
}
