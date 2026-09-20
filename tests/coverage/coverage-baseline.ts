export type CoverageSource = 'jest-v8' | 'playwright-derived' | 'ci-report';
export type CoverageScope = 'global' | 'critical-area';

export interface CoverageBaseline {
  id: string;
  measuredAt: string;
  source: CoverageSource;
  scope: CoverageScope;
  targetPath?: string;
  branches?: number;
  functions?: number;
  lines: number;
  statements?: number;
  notes?: string;
}

export const coverageBaselines: CoverageBaseline[] = [
  {
    id: 'global-jest-v8-baseline',
    measuredAt: '2026-04-18T00:00:00.000Z',
    source: 'jest-v8',
    scope: 'global',
    lines: 62,
    statements: 65,
    functions: 68,
    branches: 58,
    notes: 'Initial repo-wide baseline captured before the targeted coverage work began.',
  },
  {
    id: 'backend-logic-baseline',
    measuredAt: '2026-04-18T00:00:00.000Z',
    source: 'jest-v8',
    scope: 'critical-area',
    targetPath: 'lib/services',
    lines: 59,
    statements: 63,
    functions: 61,
    branches: 54,
    notes: 'Focused starting point for booking and prerequisite logic, where high-value rules live.',
  },
];
