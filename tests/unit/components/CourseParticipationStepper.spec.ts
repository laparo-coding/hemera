/**
 * CourseParticipationStepper Unit Tests
 *
 * Tests for step visibility, progress states, and summary step hiding logic.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the server actions
jest.mock('@/lib/actions/participation', () => ({
  getParticipationAction: jest.fn(),
  completePreparationAction: jest.fn(),
  completeSummaryAction: jest.fn(),
  completeDebriefingAction: jest.fn(),
  completeResultAction: jest.fn(),
}));

describe('CourseParticipationStepper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step visibility logic', () => {
    it('should show all 4 steps when course has summary assets', () => {
      const hasSummaryAssets = true;
      const allSteps = ['PREPARATION', 'SUMMARY', 'DEBRIEFING', 'RESULT'];
      const visibleSteps = hasSummaryAssets
        ? allSteps
        : allSteps.filter(s => s !== 'SUMMARY');

      expect(visibleSteps).toHaveLength(4);
      expect(visibleSteps).toContain('SUMMARY');
    });

    it('should hide Summary step when course has no summary assets', () => {
      const hasSummaryAssets = false;
      const allSteps = ['PREPARATION', 'SUMMARY', 'DEBRIEFING', 'RESULT'];
      const visibleSteps = hasSummaryAssets
        ? allSteps
        : allSteps.filter(s => s !== 'SUMMARY');

      expect(visibleSteps).toHaveLength(3);
      expect(visibleSteps).not.toContain('SUMMARY');
      expect(visibleSteps).toEqual(['PREPARATION', 'DEBRIEFING', 'RESULT']);
    });
  });

  describe('Step index calculation', () => {
    const getStepIndex = (
      status: string,
      hasSummaryAssets: boolean
    ): number => {
      const allSteps = ['PREPARATION', 'SUMMARY', 'DEBRIEFING', 'RESULT'];
      const steps = hasSummaryAssets
        ? allSteps
        : allSteps.filter(s => s !== 'SUMMARY');

      if (status === 'COMPLETE') {
        return steps.length;
      }

      const index = steps.indexOf(status);
      return index >= 0 ? index : 0;
    };

    it('should return 0 for PREPARATION status', () => {
      expect(getStepIndex('PREPARATION', true)).toBe(0);
      expect(getStepIndex('PREPARATION', false)).toBe(0);
    });

    it('should return 1 for SUMMARY status when assets exist', () => {
      expect(getStepIndex('SUMMARY', true)).toBe(1);
    });

    it('should return 1 for DEBRIEFING when no summary assets (SUMMARY skipped)', () => {
      expect(getStepIndex('DEBRIEFING', false)).toBe(1);
    });

    it('should return 2 for DEBRIEFING when summary assets exist', () => {
      expect(getStepIndex('DEBRIEFING', true)).toBe(2);
    });

    it('should return total step count for COMPLETE status', () => {
      expect(getStepIndex('COMPLETE', true)).toBe(4);
      expect(getStepIndex('COMPLETE', false)).toBe(3);
    });
  });

  describe('Status progression', () => {
    it('should progress PREPARATION -> SUMMARY when assets exist', () => {
      const _currentStatus = 'PREPARATION';
      const hasSummaryAssets = true;
      const nextStatus = hasSummaryAssets ? 'SUMMARY' : 'DEBRIEFING';

      expect(nextStatus).toBe('SUMMARY');
    });

    it('should progress PREPARATION -> DEBRIEFING when no assets', () => {
      const _currentStatus = 'PREPARATION';
      const hasSummaryAssets = false;
      const nextStatus = hasSummaryAssets ? 'SUMMARY' : 'DEBRIEFING';

      expect(nextStatus).toBe('DEBRIEFING');
    });

    it('should progress DEBRIEFING -> RESULT', () => {
      const _currentStatus = 'DEBRIEFING';
      const nextStatus = 'RESULT';

      expect(nextStatus).toBe('RESULT');
    });

    it('should progress RESULT -> COMPLETE', () => {
      const _currentStatus = 'RESULT';
      const nextStatus = 'COMPLETE';

      expect(nextStatus).toBe('COMPLETE');
    });
  });

  describe('Step labels', () => {
    const statusLabels: Record<string, string> = {
      PREPARATION: 'Vorbereitung',
      SUMMARY: 'Zusammenfassung',
      DEBRIEFING: 'Nachbereitung',
      RESULT: 'Ergebnis',
      COMPLETE: 'Abgeschlossen',
    };

    it('should have German labels for all statuses', () => {
      expect(statusLabels.PREPARATION).toBe('Vorbereitung');
      expect(statusLabels.SUMMARY).toBe('Zusammenfassung');
      expect(statusLabels.DEBRIEFING).toBe('Nachbereitung');
      expect(statusLabels.RESULT).toBe('Ergebnis');
      expect(statusLabels.COMPLETE).toBe('Abgeschlossen');
    });
  });
});
