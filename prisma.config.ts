// @ts-nocheck
// Prisma 7 configuration: move datasource URL out of schema
// Docs: https://pris.ly/d/config-datasource
import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Keep loose typing to remain compatible with prisma CLI expectations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
