import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { criticalAreas } from './tests/critical-areas.js';

const unitMeasuredCriticalAreaPaths = (
  criticalAreas as Array<{ paths: string[] }>
)
  .flatMap((area: { paths: string[] }) => area.paths)
  .filter(
    (filePath: string) =>
      filePath.startsWith('lib/') ||
      filePath.startsWith('components/dashboard/')
  );

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '@jest/globals': fileURLToPath(
        new URL('./tests/vitest/jest-globals.ts', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // These four integration specs still rely on environment and lifecycle
    // assumptions that are intentionally not part of the shared Vitest path yet.
    // Re-evaluate once the migration follow-up task in
    // specs/029-jest-to-vitest-migration/tasks.md restores deterministic
    // coverage for the participant-flow and summary-visibility paths.
    exclude: [
      'tests/e2e/**',
      'tests/integration/participant-flow.spec.ts',
      'tests/integration/summary-visibility.spec.ts',
      'tests/integration/016-course-assignments/participant-flow.spec.ts',
      'tests/integration/016-course-assignments/summary-visibility.spec.ts',
    ],
    // Keep generous global timeouts while integration suites still spin up
    // shared infrastructure and Prisma/Testcontainers setup inside the unified
    // runner. Follow-up profiling should move slow paths to per-suite or
    // per-test timeouts instead of keeping this as a silent default forever.
    testTimeout: 90000,
    hookTimeout: 90000,
    // Keep the runner fully sequential until the remaining DB-backed and
    // shared-state suites are profiled and isolated. This avoids reintroducing
    // order-dependent flakes during the migration close-out.
    maxWorkers: 1,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: Array.from(
        new Set(['lib/**/*.ts', ...unitMeasuredCriticalAreaPaths])
      ),
    },
  },
});
