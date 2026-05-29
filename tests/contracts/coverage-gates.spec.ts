import { describe, expect, it } from '@/tests/vitest/jest-globals';
import { coverageTargets } from '../coverage/coverage-targets';
import { criticalAreas } from '../coverage/critical-areas';
import { qualityGates } from '../coverage/quality-gates';

describe('Coverage and CI Gate Contract', () => {
  it('defines mixed critical areas across backend, API, and dashboard journeys', () => {
    expect(criticalAreas.map(area => area.category)).toEqual(
      expect.arrayContaining([
        'backend-logic',
        'api-behavior',
        'dashboard-journey',
      ])
    );
  });

  it('requires both global and critical-area coverage targets', () => {
    expect(coverageTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ scope: 'global' }),
        expect.objectContaining({ scope: 'critical-area' }),
      ])
    );
  });

  it('defines at least one pull-request gate and one main-branch gate', () => {
    expect(qualityGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pipelineStage: 'pull-request' }),
        expect.objectContaining({ pipelineStage: 'main' }),
      ])
    );
  });
});
