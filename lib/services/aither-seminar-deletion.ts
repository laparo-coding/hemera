/**
 * Server-side client for Aither's
 * `DELETE /api/service/seminar-recordings/[recordingId]`
 * (Feature 012-video-transcription, FR-017/FR-023).
 *
 * Requests idempotent provider cleanup (AssemblyAI, MUX, Blob) for a seminar
 * recording. Aither acknowledges with 202 (accepted/in progress) or 200
 * (every known artifact deleted — safe to purge the Hemera tombstone).
 * Neither the service key nor returned URLs are logged or persisted.
 */

import { z } from 'zod';
import { createFetchTimeoutSignal } from '@/lib/utils/fetch-timeout';

const DELETE_TIMEOUT_MS = 10_000;
const MIN_SERVICE_KEY_LENGTH = 32;
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export type AitherDeletionErrorKind =
  | 'not_configured'
  | 'unavailable'
  | 'rejected';

/**
 * Carries only a classification and non-sensitive diagnostics so it can be
 * logged safely.
 */
export class AitherDeletionError extends Error {
  readonly kind: AitherDeletionErrorKind;
  readonly upstreamStatus: number | undefined;
  readonly reason: string | undefined;

  constructor(
    kind: AitherDeletionErrorKind,
    details: { upstreamStatus?: number; reason?: string } = {}
  ) {
    super(`Aither seminar recording deletion failed: ${kind}`);
    this.name = 'AitherDeletionError';
    this.kind = kind;
    this.upstreamStatus = details.upstreamStatus;
    this.reason = details.reason;
  }
}

const DeletionAckSchema = z.object({
  accepted: z.boolean().optional(),
  status: z.string().optional(),
});

export type AitherDeletionAck = z.infer<typeof DeletionAckSchema>;

// Prisma enum values are converted to the lowercase wire format defined by
// the OpenAPI contract (Aither's DeletionRequestSchema rejects uppercase).
const DELETION_REASON_TO_WIRE = {
  BOOKING_DELETED: 'booking_deleted',
  PARTICIPATION_DELETED: 'participation_deleted',
  OPERATOR_ABANDONED: 'operator_abandoned',
} as const;

export type PrismaDeletionReason = keyof typeof DELETION_REASON_TO_WIRE;

interface AitherConfig {
  baseUrl: URL;
  serviceKey: string;
}

function loadAitherConfig(): AitherConfig | null {
  const baseUrl = process.env.AITHER_API_URL?.trim();
  const serviceKey = process.env.AITHER_SERVICE_KEY?.trim();
  if (!baseUrl || !serviceKey || serviceKey.length < MIN_SERVICE_KEY_LENGTH) {
    return null;
  }

  let origin: URL;
  try {
    origin = new URL(baseUrl);
  } catch {
    return null;
  }

  // The service key must never travel over cleartext HTTP (loopback is only
  // allowed for local development).
  const isHttps = origin.protocol === 'https:';
  const isLoopbackHttp =
    origin.protocol === 'http:' && LOOPBACK_HOSTNAMES.has(origin.hostname);
  if (!isHttps && !isLoopbackHttp) {
    return null;
  }

  return { baseUrl: origin, serviceKey };
}

/**
 * Requests idempotent provider cleanup for a seminar recording.
 *
 * @throws AitherDeletionError when Aither is not configured, is
 * unreachable, or rejects the deletion request.
 */
export async function requestSeminarRecordingDeletion(target: {
  bookingId: string;
  recordingId: string;
  deletionId: string;
  deletionReason: PrismaDeletionReason;
}): Promise<AitherDeletionAck> {
  const config = loadAitherConfig();
  if (!config) {
    throw new AitherDeletionError('not_configured');
  }

  const endpoint = new URL(
    `api/service/seminar-recordings/${encodeURIComponent(target.recordingId)}`,
    config.baseUrl.origin
  );

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Aither-Service-Key': config.serviceKey,
      },
      body: JSON.stringify({
        bookingId: target.bookingId,
        deletionId: target.deletionId,
        deletionReason: DELETION_REASON_TO_WIRE[target.deletionReason],
      }),
      cache: 'no-store',
      // Never replay the service key to a redirect target.
      redirect: 'error',
      signal: createFetchTimeoutSignal(DELETE_TIMEOUT_MS),
    });
  } catch (error) {
    throw new AitherDeletionError('unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    });
  }

  // 202: accepted or already in progress; 200: every artifact confirmed
  // deleted. Both are successful dispatches.
  if (response.status !== 200 && response.status !== 202) {
    throw new AitherDeletionError('rejected', {
      upstreamStatus: response.status,
    });
  }

  const parsed = DeletionAckSchema.safeParse(
    await response.json().catch(() => null)
  );
  if (!parsed.success) {
    throw new AitherDeletionError('unavailable', {
      upstreamStatus: response.status,
      reason: 'invalid_response',
    });
  }

  return parsed.data;
}
