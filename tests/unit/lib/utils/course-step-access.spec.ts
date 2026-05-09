import { describe, expect, it } from '@jest/globals';
import {
  hasCourseStarted,
  shouldLockCourseStepsUntilSeminarStart,
  shouldUnlockFutureCourseStepsInDevelopment,
} from '@/lib/utils/course-step-access';

const STARTED_DATE = '2020-06-15T12:00:00.000Z';
const FUTURE_DATE = '2099-06-15T12:00:00.000Z';
const ENV_DEVELOPMENT = 'development';
const ENV_TEST = 'test';

describe('shouldUnlockFutureCourseStepsInDevelopment', () => {
  it('unlocks future steps in development after seminar start', () => {
    expect(
      shouldUnlockFutureCourseStepsInDevelopment(
        STARTED_DATE,
        ENV_DEVELOPMENT
      )
    ).toBe(true);
  });

  it('unlocks future steps in development before seminar start', () => {
    expect(
      shouldUnlockFutureCourseStepsInDevelopment(
        FUTURE_DATE,
        ENV_DEVELOPMENT
      )
    ).toBe(true);
  });

  it('does not unlock future steps outside development mode', () => {
    expect(
      shouldUnlockFutureCourseStepsInDevelopment(FUTURE_DATE, ENV_TEST)
    ).toBe(false);
  });
});

describe('hasCourseStarted', () => {
  it('returns true for started seminars', () => {
    expect(hasCourseStarted(STARTED_DATE)).toBe(true);
  });

  it('returns false for future seminars', () => {
    expect(hasCourseStarted(FUTURE_DATE)).toBe(false);
  });
});

describe('shouldLockCourseStepsUntilSeminarStart', () => {
  it('locks future seminar steps outside development mode before seminar start', () => {
    expect(
      shouldLockCourseStepsUntilSeminarStart(FUTURE_DATE, ENV_TEST)
    ).toBe(true);
  });

  it('does not lock future seminar steps in development mode', () => {
    expect(
      shouldLockCourseStepsUntilSeminarStart(FUTURE_DATE, ENV_DEVELOPMENT)
    ).toBe(false);
  });

  it('does not lock started seminar steps outside development mode', () => {
    expect(
      shouldLockCourseStepsUntilSeminarStart(STARTED_DATE, ENV_TEST)
    ).toBe(false);
  });
});
