import { describe, expect, it } from '@/tests/vitest/jest-globals';
import { criticalAreas } from '../coverage/critical-areas';
import { qualityGates } from '../coverage/quality-gates';
import { testWorkstreams } from '../coverage/test-workstreams';

describe('Coverage Workflow', () => {
  it('maps workstreams onto the planned critical areas', () => {
    const criticalAreaIds = new Set(criticalAreas.map(area => area.id));

    for (const workstream of testWorkstreams) {
      for (const candidatePath of workstream.candidatePaths) {
        expect(candidatePath).toMatch(/^(app|components|lib|tests)\//);
      }

      expect(criticalAreaIds.has(workstream.id)).toBe(true);
    }
  });

  it('rolls gates from planned to enforced without skipping trial', () => {
    expect(qualityGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rolloutPhase: 'planned' }),
        expect.objectContaining({ rolloutPhase: 'trial' }),
        expect.objectContaining({ rolloutPhase: 'enforced' }),
      ])
    );
  });
});
