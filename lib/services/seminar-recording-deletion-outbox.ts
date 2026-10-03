/**
 * Deletion outbox dispatcher for seminar recording provider cleanup
 * (Feature 012-video-transcription, FR-017/FR-023).
 *
 * Outbox rows are created atomically when workflows are marked
 * DELETION_PENDING (e.g. admin booking rejection). Dispatching to Aither's
 * DELETE endpoint happens after the transaction commits — via `after()` in
 * the triggering request and on every subsequent trigger for retries.
 * Aither confirms completion through the workflow PUT (deletionConfirmedAt),
 * which purges the workflow, its idempotency rows, and the outbox entry.
 */

import { prisma } from '@/lib/db/prisma';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  AitherDeletionError,
  requestSeminarRecordingDeletion,
} from '@/lib/services/aither-seminar-deletion';

const MAX_DISPATCH_ATTEMPTS = 10;

/**
 * Dispatches pending outbox entries to Aither. Safe to call concurrently:
 * each entry is claimed with a conditional update (attempts < MAX), so a
 * concurrent dispatcher cannot double-dispatch an entry.
 */
export async function dispatchSeminarRecordingDeletions(): Promise<number> {
  const pending = await prisma.seminarRecordingDeletionOutbox.findMany({
    where: { dispatchedAt: null, attempts: { lt: MAX_DISPATCH_ATTEMPTS } },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  let dispatched = 0;
  for (const entry of pending) {
    // Claim the entry: only proceed when the attempt counter still allows it.
    const claim = await prisma.seminarRecordingDeletionOutbox.updateMany({
      where: {
        id: entry.id,
        dispatchedAt: null,
        attempts: entry.attempts,
      },
      data: { attempts: { increment: 1 } },
    });
    if (claim.count !== 1) {
      continue; // Another dispatcher claimed it or it is exhausted.
    }

    try {
      await requestSeminarRecordingDeletion({
        bookingId: entry.bookingId,
        recordingId: entry.recordingId,
        deletionId: entry.deletionId,
        deletionReason: entry.deletionReason,
      });
      await prisma.seminarRecordingDeletionOutbox.update({
        where: { id: entry.id },
        data: { dispatchedAt: new Date(), lastError: null },
      });
      dispatched += 1;
    } catch (error) {
      const reason =
        error instanceof AitherDeletionError
          ? `${error.kind}${error.upstreamStatus ? `:${error.upstreamStatus}` : ''}`
          : 'unknown';
      await prisma.seminarRecordingDeletionOutbox.update({
        where: { id: entry.id },
        data: { lastError: reason },
      });
      serverInstance.warn('Seminar recording deletion dispatch failed', {
        bookingId: entry.bookingId,
        recordingId: entry.recordingId,
        attempts: entry.attempts + 1,
        reason,
      });
    }
  }
  return dispatched;
}
