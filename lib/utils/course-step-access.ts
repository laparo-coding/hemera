export function hasCourseStarted(
  courseStartDate: string | Date | null | undefined,
  now = Date.now()
): boolean {
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

  return start.getTime() <= now;
}

export function shouldUnlockFutureCourseStepsInDevelopment(
  courseStartDate: string | Date | null | undefined,
  nodeEnv = process.env.NODE_ENV
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

  return true;
}

export function shouldLockCourseStepsUntilSeminarStart(
  courseStartDate: string | Date | null | undefined,
  nodeEnv = process.env.NODE_ENV,
  now = Date.now()
): boolean {
  return (
    !shouldUnlockFutureCourseStepsInDevelopment(courseStartDate, nodeEnv) &&
    !hasCourseStarted(courseStartDate, now)
  );
}
