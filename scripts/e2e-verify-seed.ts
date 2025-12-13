import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// For E2E tests with SQLite, we skip the adapter (used in production with PostgreSQL)
// Prisma will use the built-in SQLite driver from DATABASE_URL env var
const prisma = new PrismaClient({
  // Explicitly set to undefined to use built-in driver
  adapter: undefined,
});

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
