#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const results = await prisma.$queryRaw`
      SELECT id, title, slug, created_at
      FROM courses
      WHERE title LIKE '%[CONTRACT-TEST]%'
      ORDER BY created_at DESC
    `;
    console.log(
      JSON.stringify(
        results,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
