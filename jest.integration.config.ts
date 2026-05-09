import type { Config } from 'jest';

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
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  // These integration specs remain intentionally ignored while the legacy
  // Playwright-first flows are being rewritten into stable integration tests.
  // Tracking references:
  // - participant-flow.spec.ts
  //   -> specs/028-test-coverage/tasks.md
  // - summary-visibility.spec.ts
  //   -> specs/028-test-coverage/tasks.md
  // - 016-course-assignments variants -> specs/016-course-assignments/tasks.md
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/integration/participant-flow.spec.ts',
    '<rootDir>/tests/integration/summary-visibility.spec.ts',
    '<rootDir>/tests/integration/016-course-assignments/participant-flow.spec.ts',
    '<rootDir>/tests/integration/016-course-assignments/summary-visibility.spec.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 90000,
  maxWorkers: 1,
};

export default config;
