/**
 * Avatar Utilities - Helper functions for Avatar components
 */

/**
 * Default fallback character for Avatar when displayName is empty
 */
const AVATAR_FALLBACK_CHAR = '?';

/**
 * Get safe initial character for Avatar display
 * Returns uppercase initial or fallback if name is empty/undefined
 *
 * @param name - Display name, title, or any string to get initial from
 * @returns Single uppercase character or fallback
 */
export function getAvatarInitial(name: string | undefined | null): string {
  const initial = name?.trim().charAt(0);
  return initial ? initial.toUpperCase() : AVATAR_FALLBACK_CHAR;
}
