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
    exclude: [
      'tests/e2e/**',
      'tests/integration/participant-flow.spec.ts',
      'tests/integration/summary-visibility.spec.ts',
      'tests/integration/016-course-assignments/participant-flow.spec.ts',
      'tests/integration/016-course-assignments/summary-visibility.spec.ts',
    ],
    testTimeout: 90000,
    hookTimeout: 90000,
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
