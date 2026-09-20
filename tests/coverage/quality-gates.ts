export type QualityGatePipelineStage = 'pull-request' | 'main' | 'nightly';
export type QualityGateRolloutPhase = 'planned' | 'trial' | 'enforced';

export interface QualityGateDefinition {
  id: string;
  name: string;
  pipelineStage: QualityGatePipelineStage;
  inputs: string[];
  failureCondition: string;
  rolloutPhase: QualityGateRolloutPhase;
}

export const qualityGates: QualityGateDefinition[] = [
  {
    id: 'coverage-pr-gate',
    name: 'Pull request coverage gate',
    pipelineStage: 'pull-request',
    inputs: [
      'coverage/coverage-summary.json',
      'npm run test:unit -- --coverage',
    ],
    failureCondition: 'line-coverage < 70% || critical-area-coverage missing',
    rolloutPhase: 'planned',
  },
  {
    id: 'coverage-main-gate',
    name: 'Main branch coverage gate',
    pipelineStage: 'main',
    inputs: [
      'coverage/coverage-summary.json',
      'npm run test:contracts',
    ],
    failureCondition: 'line-coverage < 75% || critical-area-coverage < 80%',
    rolloutPhase: 'trial',
  },
  {
    id: 'coverage-nightly-gate',
    name: 'Nightly coverage verification gate',
    pipelineStage: 'nightly',
    inputs: [
      'coverage/coverage-summary.json',
      'npm run test:e2e:public',
    ],
    failureCondition: 'critical-area drift > 0 || test-count delta < 0',
    rolloutPhase: 'enforced',
  },
];
