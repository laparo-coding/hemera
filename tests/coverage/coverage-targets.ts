export type CoverageTargetStatus = 'proposed' | 'approved' | 'enforced';
export type CoverageTargetGateType = 'report-only' | 'soft-gate' | 'hard-gate';
export type CoverageTargetThresholdStrategy = 'absolute' | 'delta' | 'mixed';

export interface CoverageTarget {
  id: string;
  scope: 'global' | 'critical-area';
  linkedAreaId?: string;
  gateType: CoverageTargetGateType;
  thresholdStrategy: CoverageTargetThresholdStrategy;
  branchThreshold?: number;
  lineThreshold?: number;
  deltaThreshold?: number;
  status: CoverageTargetStatus;
  notes?: string;
}

export const coverageTargets: CoverageTarget[] = [
  {
    id: 'global-coverage-proposed',
    scope: 'global',
    gateType: 'report-only',
    thresholdStrategy: 'mixed',
    lineThreshold: 70,
    deltaThreshold: 5,
    status: 'proposed',
    notes:
      'Global floor is intentionally kept as a proposed planning signal until the baseline is reviewed.',
  },
  {
    id: 'backend-logic-critical-target',
    scope: 'critical-area',
    linkedAreaId: 'backend-logic',
    gateType: 'soft-gate',
    thresholdStrategy: 'mixed',
    lineThreshold: 80,
    branchThreshold: 70,
    deltaThreshold: 8,
    status: 'proposed',
    notes:
      'Booking and prerequisite logic should materially improve before strict enforcement.',
  },
  {
    id: 'api-behavior-critical-target',
    scope: 'critical-area',
    linkedAreaId: 'api-behavior',
    gateType: 'soft-gate',
    thresholdStrategy: 'absolute',
    lineThreshold: 75,
    branchThreshold: 65,
    status: 'approved',
    notes: 'Contract-backed API behavior must stay above the planned threshold after review.',
  },
];
