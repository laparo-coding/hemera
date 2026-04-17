/**
 * Shared booking-related types used across API normalization and frontend.
 */

import type { PaymentStatus as PrismaPaymentStatus } from '@prisma/client';

export const PAYMENT_STATUSES = [
  'PENDING',
  'PRE_BOOKED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'CONFIRMED',
] as const satisfies readonly PrismaPaymentStatus[];

export type PaymentStatus = PrismaPaymentStatus;

type MissingPaymentStatuses = Exclude<
  PrismaPaymentStatus,
  (typeof PAYMENT_STATUSES)[number]
>;
type ExtraPaymentStatuses = Exclude<
  (typeof PAYMENT_STATUSES)[number],
  PrismaPaymentStatus
>;
type PaymentStatusesMatchBackend = [
  MissingPaymentStatuses,
  ExtraPaymentStatuses,
] extends [never, never]
  ? true
  : never;

const paymentStatusesMatchBackend: PaymentStatusesMatchBackend = true;

void paymentStatusesMatchBackend;

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}
