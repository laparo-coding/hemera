/**
 * Shared helper für Service-API-Auth-Fehlerbehandlung.
 *
 * Vermeidet 35+ Zeilen duplizierten Auth-Error-Handling-Codes im
 * identischen Block aller vier Service-Route-Handler durch Extraktion
 * in diese zentrale Hilfsfunktion.
 */

import type { NextResponse } from 'next/server';
import type { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import { createServiceApiErrorResponse } from '@/lib/utils/service-api-response';
import type { ServiceAuthError } from './service-auth';

type Logger = ReturnType<typeof createApiLogger>;

/**
 * Wandelt einen `ServiceAuthError` in eine `NextResponse` um und loggt
 * dabei passende Warnungen. Enthält ein exhaustive `never`-Check für
 * Typsicherheit bei zukünftigen Erweiterungen von `ServiceAuthError`.
 */
export function handleServiceAuthError(
  authResult: ServiceAuthError,
  logger: Logger,
  requestId: string
): Promise<NextResponse> {
  if (authResult.error === 'unauthenticated') {
    logger.warn('Unauthenticated request');
    return createServiceApiErrorResponse(
      'Not authenticated',
      ErrorCodes.UNAUTHORIZED,
      requestId,
      401
    );
  }

  if (authResult.error === 'forbidden') {
    logger.warn('Forbidden: insufficient permissions', {
      userId: authResult.userId,
      role: authResult.role,
    });
    return createServiceApiErrorResponse(
      'Forbidden: api-client or admin role required',
      ErrorCodes.FORBIDDEN,
      requestId,
      403,
      authResult.userId,
      authResult.role
    );
  }

  if (authResult.error === 'internal_error') {
    logger.error(
      'Internal auth error: getUserRole failed for authenticated user',
      undefined,
      { userId: authResult.userId }
    );
    return createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }

  // Exhaustive check — wird zur Compile-Zeit fehlschlagen, wenn
  // ServiceAuthError um neue Varianten erweitert wird ohne Behandlung hier.
  const exhaustiveCheck: never = authResult;
  let serialized: string;
  try {
    serialized = JSON.stringify(exhaustiveCheck);
  } catch {
    serialized = '[nicht serialisierbar]';
  }
  logger.error('Unexpected auth error variant', undefined, {
    authError: serialized,
  });
  return createServiceApiErrorResponse(
    'Service authentication error',
    ErrorCodes.INTERNAL_ERROR,
    requestId,
    500
  );
}
