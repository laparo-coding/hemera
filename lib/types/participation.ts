/**
 * Shared types and helpers for course participation features.
 * Feature: 027-user-course-management
 */

import type { ParticipationStatus as PrismaParticipationStatus } from '@prisma/client';

export const PARTICIPATION_STATUSES = [
  'PREPARATION',
  'SUMMARY',
  'DEBRIEFING',
  'RESULT',
  'COMPLETE',
] as const satisfies readonly PrismaParticipationStatus[];

export type ParticipationStatus = PrismaParticipationStatus;

type MissingParticipationStatuses = Exclude<
  PrismaParticipationStatus,
  (typeof PARTICIPATION_STATUSES)[number]
>;
type ExtraParticipationStatuses = Exclude<
  (typeof PARTICIPATION_STATUSES)[number],
  PrismaParticipationStatus
>;
type ParticipationStatusesMatchBackend = [
  MissingParticipationStatuses,
  ExtraParticipationStatuses,
] extends [never, never]
  ? true
  : never;

const participationStatusesMatchBackend: ParticipationStatusesMatchBackend = true;

void participationStatusesMatchBackend;

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
