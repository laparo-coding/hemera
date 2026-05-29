import { describe, expect, it } from '@/tests/vitest/jest-globals';
import {
  ParticipationStatus as PrismaParticipationStatus,
  PaymentStatus as PrismaPaymentStatus,
} from '@prisma/client';
import { PAYMENT_STATUSES, isPaymentStatus } from '@/lib/types/booking';
import {
  PARTICIPATION_STATUSES,
  type ParticipationStatus,
} from '@/lib/types/participation';

describe('shared status types', () => {
  it('mirrors Prisma PaymentStatus values exactly', () => {
    expect(PAYMENT_STATUSES).toEqual(Object.values(PrismaPaymentStatus));
  });

  it('mirrors Prisma ParticipationStatus values exactly', () => {
    expect(PARTICIPATION_STATUSES).toEqual(
      Object.values(PrismaParticipationStatus)
    );
  });

  it('accepts valid payment status values via helper', () => {
    Object.values(PrismaPaymentStatus).forEach(status => {
      expect(isPaymentStatus(status)).toBe(true);
    });
  });

  it('rejects invalid payment status values via helper', () => {
    ['PROCESSING', 'UNKNOWN', '', null, undefined].forEach(status => {
      expect(isPaymentStatus(status)).toBe(false);
    });
  });

  it('keeps participation status values usable as shared type literals', () => {
    const statuses: ParticipationStatus[] = [...PARTICIPATION_STATUSES];

    expect(statuses).toEqual(Object.values(PrismaParticipationStatus));
  });
});