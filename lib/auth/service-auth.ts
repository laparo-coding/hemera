/**
 * Unified authentication for Service API endpoints.
 *
 * Unterstützt zwei Auth-Methoden:
 * 1. Clerk Session JWT (via `auth()`) — für Browser-basierte Zugriffe
 * 2. API Key (via `X-API-Key` Header) — für M2M / Service-to-Service
 *
 * Beide Methoden lösen auf die gleiche (userId, role)-Kombination auf,
 * sodass Rate-Limiting, Audit-Logging und Permissions einheitlich funktionieren.
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { reportError } from '@/lib/monitoring/rollbar-official';
import type { UserRole } from './permissions';
import { getUserRole } from './permissions';
import { extractApiKey, validateServiceApiKey } from './service-api-key';

/** Rollen, die Zugriff auf Service-API-Endpunkte haben. */
export const ALLOWED_SERVICE_ROLES: ReadonlyArray<UserRole> = [
  'api-client',
  'admin',
];

export interface ServiceAuthResult {
  userId: string;
  role: UserRole;
  authMethod: 'clerk' | 'api-key';
}

/**
 * Authentifiziert einen Service-API-Request.
 *
 * Ablauf:
 * 1. Prüfe auf X-API-Key Header → API-Key-Auth
 * 2. Wenn kein API Key, versuche Clerk `auth()` → Session-Auth
 * 3. Wenn beides fehlschlägt → null (unauthenticated)
 *
 * Autorisierung (Rolle api-client oder admin) wird hier gleichzeitig geprüft.
 */
export async function authenticateServiceRequest(
  request: NextRequest
): Promise<
  | ServiceAuthResult
  | { error: 'unauthenticated' }
  | { error: 'forbidden'; userId: string; role: UserRole }
> {
  // --- Pfad 1: API Key Auth ---
  const apiKey = extractApiKey(request.headers);
  if (apiKey) {
    const result = validateServiceApiKey(apiKey);
    if (result) {
      return {
        userId: result.userId,
        role: result.role,
        authMethod: 'api-key',
      };
    }
    // Ungültiger API Key → unauthenticated (kein Fallback auf Clerk)
    return { error: 'unauthenticated' };
  }

  // --- Pfad 2: Clerk Session Auth ---
  let userId: string | null;
  try {
    const authRes = await auth();
    userId = authRes.userId;
  } catch (err: unknown) {
    reportError(
      err instanceof Error
        ? err
        : new Error('Clerk auth() failed in service-auth'),
      {
        additionalData: {
          operation: 'authenticateServiceRequest',
          step: 'auth',
        },
      }
    );
    return { error: 'unauthenticated' };
  }

  if (!userId) {
    return { error: 'unauthenticated' };
  }

  let role: UserRole;
  try {
    role = await getUserRole(userId);
  } catch (err: unknown) {
    reportError(
      err instanceof Error
        ? err
        : new Error('getUserRole() failed in service-auth'),
      {
        additionalData: {
          operation: 'authenticateServiceRequest',
          step: 'getUserRole',
          userId,
        },
      }
    );
    return { error: 'unauthenticated' };
  }

  if (!ALLOWED_SERVICE_ROLES.includes(role)) {
    return { error: 'forbidden', userId, role };
  }

  return {
    userId,
    role,
    authMethod: 'clerk',
  };
}
