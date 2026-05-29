import { describe, expect, it } from '@/tests/vitest/jest-globals';
import { coverageBaselines } from '../coverage/coverage-baseline';
import { coverageTargets } from '../coverage/coverage-targets';

describe('Coverage Baseline Workflow', () => {
  it('tracks a captured global baseline before any hard gate is enforced', () => {
    expect(coverageBaselines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: 'global',
          source: 'jest-v8',
        }),
      ])
    );

    expect(coverageTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scope: 'global',
          status: 'proposed',
        }),
      ])
    );
  });
});
