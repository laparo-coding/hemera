import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// For E2E tests with SQLite, Prisma will use the built-in driver from DATABASE_URL
// We don't pass any options since the adapter is only needed for PostgreSQL in production
const prisma = new PrismaClient();

async function verifySeed() {
  try {
    const [publishedCount, sampleCourses] = await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const payload = {
      generatedAt: new Date().toISOString(),
      publishedCount,
      sample: sampleCourses,
    };

    fs.writeFileSync(
      '/tmp/course-debug.json',
      JSON.stringify(payload, null, 2)
    );
    console.log('Saved course debug snapshot to /tmp/course-debug.json');
    console.log('Seed verification - published courses:', publishedCount);
  } catch (error) {
    console.error('Failed to write course debug snapshot:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeed();
