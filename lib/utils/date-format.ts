/**
 * Date/Time formatting utilities for consistent timezone handling
 * All times are displayed in Europe/Berlin timezone
 */

const TIMEZONE = 'Europe/Berlin';

/**
 * Format a time value for display (e.g., "09:00")
 */
export function formatTime(
  date: Date | string | null | undefined
): string | undefined {
  if (!date) return undefined;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(dateObj.getTime())) return undefined;
  return dateObj.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  });
}

/**
 * Format a time range for display (e.g., "09:00 - 17:00")
 */
export function formatTimeRange(
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined
): string | undefined {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (!start || !end) return undefined;
  return `${start} - ${end}`;
}

/**
 * Format a date for display (e.g., "20. Juni 2026")
 */
export function formatDate(
  date: Date | string | null | undefined
): string | undefined {
  if (!date) return undefined;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(dateObj.getTime())) return undefined;
  return dateObj.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Format a short date for display (e.g., "20. Jun. 2026")
 */
export function formatShortDate(
  date: Date | string | null | undefined
): string | undefined {
  if (!date) return undefined;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(dateObj.getTime())) return undefined;
  return dateObj.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Format a month and year for display (e.g., "Januar 2026")
 * Useful for testimonial timestamps where day precision isn't needed.
 */
export function formatMonthYear(
  date: Date | string | null | undefined
): string | undefined {
  if (!date) return undefined;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(dateObj.getTime())) return undefined;
  return dateObj.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    timeZone: TIMEZONE,
  });
}
