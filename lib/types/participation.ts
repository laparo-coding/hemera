/**
 * Shared types and helpers for course participation features.
 * Feature: 027-user-course-management
 */

export const NEGOTIATION_PARTNERS = [
  'DIRECT_MANAGER',
  'SKIP_LEVEL_MANAGER',
  'HR_DEPARTMENT',
] as const;

export type NegotiationPartner = (typeof NEGOTIATION_PARTNERS)[number];

export function isNegotiationPartner(
  value: unknown
): value is NegotiationPartner {
  return (
    typeof value === 'string' &&
    (NEGOTIATION_PARTNERS as readonly string[]).includes(value)
  );
}
