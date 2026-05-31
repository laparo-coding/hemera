/**
 * API-Key-basierte Authentifizierung für Service-to-Service-Kommunikation.
 *
 * Clerk session JWTs können nicht programmatisch für M2M-Kommunikation in
 * Production erstellt werden. Daher bieten wir einen parallelen Auth-Pfad
 * über einen statischen API Key an, der im Header `X-API-Key` gesendet wird.
 *
 * Security:
 * - Der Key wird über die Env-Variable `HEMERA_SERVICE_API_KEY` konfiguriert
 * - Mehrere aktive Keys können für einfache Rotation comma-separated gesetzt werden
 * - Timing-sichere Vergleiche über `crypto.timingSafeEqual`
 * - Der zugehörige Service-User-ID wird über `HEMERA_SERVICE_USER_ID` aufgelöst
 */

import { timingSafeEqual } from 'node:crypto';
import type { UserRole } from './permissions';

export interface ServiceApiKeyResult {
  userId: string;
  role: UserRole;
}

let hasLoggedDiscardedApiKeysWarning = false;
let hasLoggedEmptyApiKeysWarning = false;

function logApiKeyConfigurationWarning(
  message: string,
  context: { configValue: string; rejectedEntries: string[] }
): void {
  // biome-ignore lint/suspicious/noConsole: One-time configuration diagnostics for service API keys
  console.warn(`[service-api-key] ${message}`, context);
}

function parseConfiguredApiKeys(configValue: string | undefined): string[] {
  if (!configValue) {
    return [];
  }

  const parsedValues = configValue.split(',').map(value => value.trim());
  const rejectedEntries = parsedValues.filter(value => value.length < 32);
  const validEntries = parsedValues.filter(value => value.length >= 32);

  if (rejectedEntries.length > 0 && !hasLoggedDiscardedApiKeysWarning) {
    hasLoggedDiscardedApiKeysWarning = true;
    logApiKeyConfigurationWarning(
      'Discarded malformed/short service API key entries.',
      {
        configValue,
        rejectedEntries,
      }
    );
  }

  if (validEntries.length === 0 && !hasLoggedEmptyApiKeysWarning) {
    hasLoggedEmptyApiKeysWarning = true;
    logApiKeyConfigurationWarning(
      'No valid service API keys remain after parsing configuration.',
      {
        configValue,
        rejectedEntries,
      }
    );
  }

  return validEntries;
}

function constantTimeEquals(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

/**
 * Validiert einen API Key aus dem Request-Header.
 * Gibt die Service-User-Identität zurück, oder null bei ungültigem Key.
 */
export function validateServiceApiKey(
  apiKey: string | null
): ServiceApiKeyResult | null {
  if (!apiKey || apiKey.length < 32 || apiKey.length > 256) return null;

  const expectedKeys = parseConfiguredApiKeys(
    process.env.HEMERA_SERVICE_API_KEY
  );
  const serviceUserId = process.env.HEMERA_SERVICE_USER_ID;

  if (expectedKeys.length === 0 || !serviceUserId) {
    return null;
  }

  const isValid = expectedKeys.some(expectedKey =>
    constantTimeEquals(apiKey, expectedKey)
  );

  if (!isValid) {
    return null;
  }

  return {
    userId: serviceUserId,
    role: 'api-client' as UserRole,
  };
}

/**
 * Extrahiert den API Key aus dem `X-API-Key` Header eines Requests.
 */
export function extractApiKey(headers: Headers): string | null {
  return headers.get('x-api-key');
}
