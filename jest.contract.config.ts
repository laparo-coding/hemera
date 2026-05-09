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
  testMatch: ['<rootDir>/tests/contracts/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 90000,
  maxWorkers: 1,
};

export default config;
