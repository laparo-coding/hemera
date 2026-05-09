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

  return (
    !shouldUnlockFutureCourseStepsInDevelopment(start, nodeEnv, now) &&
    !hasCourseStarted(start, now)
  );
}
