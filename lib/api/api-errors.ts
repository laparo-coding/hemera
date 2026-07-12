import { NextResponse } from 'next/server';

import { serverInstance } from '@/lib/monitoring/rollbar-official';

/**
 * Creates a standardized 500 error response and logs to Rollbar.
 *
 * Replaces the duplicated try/catch error blocks across API routes.
 */
export function handleServerError(
  error: unknown,
  context: string,
  requestId: string,
  message: string
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  serverInstance.error(context, { requestId, error: errorMessage });
  return NextResponse.json(
    { error: 'internal_error', message },
    { status: 500 }
  );
}

/**
 * Creates a standardized validation error response (400).
 */
export function validationError(message: string): NextResponse {
  return NextResponse.json(
    { error: 'validation_error', message },
    { status: 400 }
  );
}

/**
 * Creates a standardized not-found response (404).
 */
export function notFoundError(message = 'Nicht gefunden'): NextResponse {
  return NextResponse.json({ error: 'not_found', message }, { status: 404 });
}
