// Prisma 7 configuration: move datasource URL out of schema
// Docs: https://pris.ly/d/config-datasource
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load environment variables from multiple sources (in order of precedence)
// This ensures DATABASE_URL is available for prisma CLI commands
config({ path: '.env.local' });
config({ path: '.env' });

// Allow prisma generate to work without DATABASE_URL (for CI/client-only generation)
// The actual connection will fail at runtime if not set, but generate only needs the schema
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  datasource: {
    // Use direct URL from environment - this works for both PostgreSQL and SQLite
    // Note: SQLite (file:) URLs require the schema.prisma provider to be 'sqlite'
    url: databaseUrl,
  },
});
