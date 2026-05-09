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

  return start.getTime() > now;
}
