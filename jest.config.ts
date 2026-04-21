import type { Config } from 'jest';
import { criticalAreas } from './tests/coverage/critical-areas.js';

const unitMeasuredCriticalAreaPaths = (
  criticalAreas as Array<{ paths: string[] }>
)
  .flatMap((area: { paths: string[] }) => area.paths)
  .filter(
    (filePath: string) =>
      filePath.startsWith('lib/') ||
      filePath.startsWith('components/dashboard/')
  );

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: { jsx: 'react-jsx', rootDir: '.', ignoreDeprecations: '6.0' },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [],
  testMatch: [
    '<rootDir>/tests/unit/**/*.spec.ts',
    '<rootDir>/tests/unit/**/*.spec.tsx',
    // Note: tests/contracts are excluded by default since they require
    // a running HTTP server. Run contract tests with: npm run test:contracts
    // Test folder structure: tests/unit/ → Jest unit tests, tests/contracts/ → Jest contract tests, tests/e2e/ → Playwright E2E
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/e2e/',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 90000, // Increase timeout for database + container operations
  maxWorkers: 1, // Force sequential execution for database tests
  // Use V8 coverage to avoid Babel parsing issues for non-transformed files
  coverageProvider: 'v8',
  // Measure the baseline library scope plus the first catalog-driven critical areas
  collectCoverageFrom: Array.from(
    new Set(['lib/**/*.ts', ...unitMeasuredCriticalAreaPaths])
  ),
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
};

export default config;
