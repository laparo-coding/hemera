export function hasCourseStarted(
  courseStartDate: string | Date | null | undefined,
  now = Date.now()
): boolean {
  if (!courseStartDate) {
    return false;
  }

  const start =
    courseStartDate instanceof Date
      ? courseStartDate
      : new Date(courseStartDate);

  if (Number.isNaN(start.getTime())) {
    return false;
  }

  return start.getTime() <= now;
}

export function shouldUnlockFutureCourseStepsInDevelopment(
  courseStartDate: string | Date | null | undefined,
  nodeEnv = process.env.NODE_ENV,
  now = Date.now()
): boolean {
  if (nodeEnv !== 'development' || !courseStartDate) {
    return false;
  }

  const start =
    courseStartDate instanceof Date
      ? courseStartDate
      : new Date(courseStartDate);

  if (Number.isNaN(start.getTime())) {
    return false;
  }

  return !hasCourseStarted(start, now);
}

export function shouldLockCourseStepsUntilSeminarStart(
  courseStartDate: string | Date | null | undefined,
  nodeEnv = process.env.NODE_ENV,
  now = Date.now()
): boolean {
  if (nodeEnv === 'development') {
    return false;
  }

  if (!courseStartDate) {
    return true;
  }

  const start =
    courseStartDate instanceof Date
      ? courseStartDate
      : new Date(courseStartDate);

  if (Number.isNaN(start.getTime())) {
    return true;
  }

  const hasStarted = hasCourseStarted(start, now);
  const shouldLock =
    !shouldUnlockFutureCourseStepsInDevelopment(start, nodeEnv, now) &&
    !hasStarted;

  // Diagnostic logging for debugging access gating issues
  if (process.env.NODE_ENV === 'production' && shouldLock === false) {
    try {
      const { serverInstance } = require('@/lib/monitoring/rollbar-official');
      serverInstance.debug(
        'Seminar step access: UNLOCKING because course has started or dev preview',
        {
          courseStartDate:
            courseStartDate instanceof Date
              ? courseStartDate.toISOString()
              : courseStartDate,
          now: new Date(now).toISOString(),
          hasStarted,
          nodeEnv,
          shouldLock,
        }
      );
    } catch {
      // Monitoring unavailable, skip logging
    }
  }

  return shouldLock;
}
