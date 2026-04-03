import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
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
  // Limit coverage collection to core library logic only
  collectCoverageFrom: ['lib/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './lib/services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Per-path overrides for areas with inherently low testability
    './lib/monitoring/': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './lib/stripe/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default config;
