// Prisma 7 configuration: move datasource URL out of schema
// Docs: https://pris.ly/d/config-datasource
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load environment variables from multiple sources (in order of precedence)
// This ensures DATABASE_URL is available for prisma CLI commands
config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
      'Please set it in .env.local, .env, or as an environment variable.'
  );
}

export default defineConfig({
  datasource: {
    // Use direct URL from environment - this works for both PostgreSQL and SQLite
    // Note: SQLite (file:) URLs require the schema.prisma provider to be 'sqlite'
    url: databaseUrl,
  },
});
