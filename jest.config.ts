import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { useESM: true, tsconfig: { jsx: 'react-jsx' } },
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
    '<rootDir>/tests/contracts/**/*.spec.ts',
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
};

export default config;
