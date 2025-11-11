import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/tests/unit/*.spec.ts',
    '<rootDir>/tests/contracts/**/*.spec.ts',
    '<rootDir>/tests/integration/**/*.spec.ts',
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
