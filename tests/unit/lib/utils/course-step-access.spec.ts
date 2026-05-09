import { describe, expect, it } from '@jest/globals';
import { shouldUnlockFutureCourseStepsInDevelopment } from '@/lib/utils/course-step-access';

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

  it('does not unlock future steps before seminar start', () => {
    expect(
      shouldUnlockFutureCourseStepsInDevelopment(
        FUTURE_DATE,
        ENV_DEVELOPMENT
      )
    ).toBe(false);
  });

  it('does not unlock future steps outside development mode', () => {
    expect(
      shouldUnlockFutureCourseStepsInDevelopment(FUTURE_DATE, ENV_TEST)
    ).toBe(false);
  });
});
