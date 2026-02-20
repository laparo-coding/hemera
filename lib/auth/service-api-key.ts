/**
 * API-Key-basierte Authentifizierung für Service-to-Service-Kommunikation.
 *
 * Clerk session JWTs können nicht programmatisch für M2M-Kommunikation in
 * Production erstellt werden. Daher bieten wir einen parallelen Auth-Pfad
 * über einen statischen API Key an, der im Header `X-API-Key` gesendet wird.
 *
 * Security:
 * - Der Key wird über die Env-Variable `HEMERA_SERVICE_API_KEY` konfiguriert
 * - Timing-sichere Vergleiche über `crypto.timingSafeEqual`
 * - Der zugehörige Service-User-ID wird über `HEMERA_SERVICE_USER_ID` aufgelöst
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { reportError } from '@/lib/monitoring/rollbar-official';
import type { UserRole } from './permissions';

export interface ServiceApiKeyResult {
  userId: string;
  role: UserRole;
}

/**
 * Validiert einen API Key aus dem Request-Header.
 * Gibt die Service-User-Identität zurück, oder null bei ungültigem Key.
 */
export function validateServiceApiKey(
  apiKey: string | null
): ServiceApiKeyResult | null {
  if (!apiKey) return null;

  // Use the validated env object so the Zod cross-field constraint (both-or-neither)
  // is enforced and avoids direct process.env bypassing the validation.
  const expectedKey = env.HEMERA_SERVICE_API_KEY;
  const serviceUserId = env.HEMERA_SERVICE_USER_ID;

  if (!expectedKey || !serviceUserId) {
    reportError(new Error('Service API key configuration missing'), {
      additionalData: {
        hasExpectedKey: !!expectedKey,
        hasServiceUserId: !!serviceUserId,
        nodeEnv: env.NODE_ENV,
      },
    });
    return null;
  }

  // Timing-sichere Prüfung: beide Keys werden zu SHA-256-Hashes normalisiert
  // und dann verglichen, um Timing-Angriffe + Length-Leaks zu vermeiden.
  const hashA = createHash('sha256').update(apiKey).digest();
  const hashB = createHash('sha256').update(expectedKey).digest();

  if (!timingSafeEqual(hashA, hashB)) {
    return null;
  }

  return {
    userId: serviceUserId,
    role: 'api-client' satisfies UserRole,
  };
}

/**
 * Extrahiert den API Key aus dem `X-API-Key` Header eines Requests.
 */
export function extractApiKey(headers: Headers): string | null {
  return headers.get('x-api-key');
}
