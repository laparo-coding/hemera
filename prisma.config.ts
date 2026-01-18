// Prisma 7 configuration: move datasource URL out of schema
// Docs: https://pris.ly/d/config-datasource
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL || '';

export default defineConfig({
  datasource: {
    // Use direct URL from environment - this works for both PostgreSQL and SQLite
    // Note: SQLite (file:) URLs require the schema.prisma provider to be 'sqlite'
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
