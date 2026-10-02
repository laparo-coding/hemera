/**
 * Server-side client for Aither's `POST /api/service/seminar-document-access`
 * (Feature 012-video-transcription, FR-012).
 *
 * Aither mints short-lived bearer URLs (MUX playback token and a five-minute
 * transcript Blob URL) and explicitly relies on the caller having verified
 * booking ownership. Callers MUST pass identifiers that were loaded from the
 * database after that check, never raw client input. Neither the service key
 * nor the returned URLs may be logged or persisted.
 */

import { z } from 'zod';
import { createFetchTimeoutSignal } from '@/lib/utils/fetch-timeout';

const ACCESS_PATH = '/api/service/seminar-document-access';
const REQUEST_TIMEOUT_MS = 10_000;
const MIN_SERVICE_KEY_LENGTH = 32;
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export type AitherAccessErrorKind =
  | 'not_configured'
  | 'not_found'
  | 'not_ready'
  | 'unavailable';

interface AitherAccessErrorDetails {
  upstreamStatus?: number;
  reason?: string;
}

/**
 * Carries only a classification and non-sensitive diagnostics so it can be
 * logged safely.
 */
export class AitherAccessError extends Error {
  readonly kind: AitherAccessErrorKind;
  readonly upstreamStatus: number | undefined;
  readonly reason: string | undefined;

  constructor(
    kind: AitherAccessErrorKind,
    details: AitherAccessErrorDetails = {}
  ) {
    super(`Aither seminar document access failed: ${kind}`);
    this.name = 'AitherAccessError';
    this.kind = kind;
    this.upstreamStatus = details.upstreamStatus;
    this.reason = details.reason;
  }
}

const httpsUrl = z
  .string()
  .url()
  .refine(value => new URL(value).protocol === 'https:', {
    message: 'URL must use https',
  });

// Unknown upstream fields are stripped, so only these four reach the browser.
const SeminarDocumentAccessSchema = z.object({
  muxPlaybackUrl: httpsUrl,
  transcriptUrl: httpsUrl,
  muxExpiresAt: z.string().datetime(),
  transcriptExpiresAt: z.string().datetime(),
});

export type SeminarDocumentAccess = z.infer<typeof SeminarDocumentAccessSchema>;

interface AitherConfig {
  endpoint: URL;
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

  return { endpoint: new URL(ACCESS_PATH, origin.origin), serviceKey };
}

/**
 * Requests fresh signed media links for a ready seminar recording.
 *
 * @throws AitherAccessError when Aither is not configured, rejects the
 * recording, is unreachable, or returns an unexpected payload.
 */
export async function requestSeminarDocumentAccess(target: {
  bookingId: string;
  recordingId: string;
}): Promise<SeminarDocumentAccess> {
  const config = loadAitherConfig();
  if (!config) {
    throw new AitherAccessError('not_configured');
  }

  let response: Response;
  try {
    response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Aither-Service-Key': config.serviceKey,
      },
      body: JSON.stringify({
        bookingId: target.bookingId,
        recordingId: target.recordingId,
      }),
      cache: 'no-store',
      // Never replay the service key to a redirect target.
      redirect: 'error',
      signal: createFetchTimeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new AitherAccessError('unavailable', {
      reason: error instanceof Error ? error.name : 'unknown',
    });
  }

  if (response.status === 404) {
    throw new AitherAccessError('not_found', { upstreamStatus: 404 });
  }
  if (response.status === 409) {
    throw new AitherAccessError('not_ready', { upstreamStatus: 409 });
  }
  if (!response.ok) {
    throw new AitherAccessError('unavailable', {
      upstreamStatus: response.status,
    });
  }

  const parsed = SeminarDocumentAccessSchema.safeParse(
    await response.json().catch(() => null)
  );
  if (!parsed.success) {
    throw new AitherAccessError('unavailable', {
      upstreamStatus: response.status,
      reason: 'invalid_response',
    });
  }

  return parsed.data;
}
