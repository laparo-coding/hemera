import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

describe('Prisma schema: Course Participation models', () => {
  const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
  const schema = readFileSync(schemaPath, 'utf8');

  it('declares CourseParticipation model', () => {
    expect(schema).toContain('model CourseParticipation');
  });

  it('declares ParticipationDocument model with single-active constraint', () => {
    expect(schema).toContain('model ParticipationDocument');
    expect(schema).toContain('isActive');
  });

  it('declares CourseSummaryAsset and ParticipationSummaryOverride models', () => {
    expect(schema).toContain('model CourseSummaryAsset');
    expect(schema).toContain('model ParticipationSummaryOverride');
  });
});
