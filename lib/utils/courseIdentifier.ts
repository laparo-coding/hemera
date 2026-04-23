/**
 * Treat course IDs as canonical CUID values.
 * Prisma cuid() values used in this codebase are matched as a leading "c"
 * followed by exactly 24 lowercase alphanumeric characters.
 */
export function isLikelyCourseId(value: string): boolean {
  return /^c[a-z0-9]{24}$/i.test(value);
}
