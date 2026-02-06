/**
 * Search normalization utilities
 *
 * Safely normalize strings for searching, handling optional/null fields
 */

/**
 * Normalize a string for search comparison
 *
 * Handles optional/null fields and converts to lowercase
 * to avoid runtime errors with incomplete data
 *
 * @param value The value to normalize (can be string or optional)
 * @returns Lowercase string, empty string if value is nullish
 *
 * @example
 * normalizeForSearch(undefined) // ''
 * normalizeForSearch('Hello') // 'hello'
 * normalizeForSearch(null) // ''
 */
export function normalizeForSearch(value: string | null | undefined): string {
  return (value ?? '').toLowerCase();
}

/**
 * Check if a searchable field contains the search query
 *
 * Safely normalizes field value and checks inclusion
 *
 * @param field The field to search in (can be optional)
 * @param query The search query to match
 * @returns true if field contains query (case-insensitive)
 *
 * @example
 * fieldMatches(course.title, 'gehalt') // true if title contains 'gehalt'
 * fieldMatches(undefined, 'test') // false
 */
export function fieldMatches(
  field: string | null | undefined,
  query: string
): boolean {
  return normalizeForSearch(field).includes(normalizeForSearch(query));
}
