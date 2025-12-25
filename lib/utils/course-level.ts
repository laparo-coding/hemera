/**
 * Course Level Utilities
 *
 * Centralized mapping between database level values and UI labels.
 * Use these utilities to ensure consistent level naming across the application.
 *
 * Database values: BEGINNER, INTERMEDIATE, ADVANCED
 * UI labels: Basis, Fortgeschrittene, Masterclass
 */

export type CourseLevelValue = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseLevelLabel = 'Basis' | 'Fortgeschrittene' | 'Masterclass';

/**
 * Map database level value to UI label
 */
export function getLevelLabel(
  level: string | null | undefined
): CourseLevelLabel {
  if (level === 'BEGINNER') return 'Basis';
  if (level === 'INTERMEDIATE') return 'Fortgeschrittene';
  if (level === 'ADVANCED') return 'Masterclass';
  // Default fallback
  return 'Basis';
}

/**
 * Map UI label back to database value
 */
export function getLevelValue(label: CourseLevelLabel): CourseLevelValue {
  if (label === 'Basis') return 'BEGINNER';
  if (label === 'Fortgeschrittene') return 'INTERMEDIATE';
  if (label === 'Masterclass') return 'ADVANCED';
  return 'BEGINNER';
}

/**
 * All available course levels with their labels
 */
export const COURSE_LEVELS: Array<{
  value: CourseLevelValue;
  label: CourseLevelLabel;
}> = [
  { value: 'BEGINNER', label: 'Basis' },
  { value: 'INTERMEDIATE', label: 'Fortgeschrittene' },
  { value: 'ADVANCED', label: 'Masterclass' },
];
