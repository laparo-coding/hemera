// Prisma 7 configuration: move datasource URL out of schema
// Docs: https://pris.ly/d/config-datasource
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
