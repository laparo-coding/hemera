#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRaw`SELECT id, title, slug, created_at FROM courses WHERE title LIKE '%[CONTRACT-TEST]%' ORDER BY created_at DESC`;
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
