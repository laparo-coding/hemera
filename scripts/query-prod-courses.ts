import { closeDb, prisma } from '../lib/db/prisma';

async function main() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      title: true,
      price: true,
      currency: true,
      capacity: true,
      startDate: true,
      startTime: true,
      endTime: true,
      description: true,
    },
    orderBy: { slug: 'asc' },
  });
  console.log(JSON.stringify(courses, null, 2));
  await closeDb();
}
void main();
