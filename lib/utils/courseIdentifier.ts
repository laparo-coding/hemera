/**
 * Treat course IDs as Prisma cuid() values.
 * The format in this codebase is a leading lowercase "c" plus 24 lowercase
 * base36 characters.
 */
export function isLikelyCourseId(value: string): boolean {
  return /^c[a-z0-9]{24}$/.test(value);
}
