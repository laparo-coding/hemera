/**
 * Client-side Error Logging
 *
 * Safe to use in 'use client' components.
 * Uses Rollbar's client instance via the React provider.
 */

'use client';

import Rollbar from 'rollbar';
import { clientConfig } from '../monitoring/rollbar-official';

// Check if we're in test/E2E mode
const isDisabled =
  process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
  process.env.E2E_TEST === 'true' ||
  process.env.NODE_ENV === 'test';

// Client-side Rollbar instance (lazy initialization)
let clientRollbar: Rollbar | null = null;

function getClientRollbar(): Rollbar | null {
  if (isDisabled) return null;
  if (typeof window === 'undefined') return null; // SSR guard

  if (!clientRollbar && clientConfig.accessToken) {
    try {
      clientRollbar = new Rollbar(clientConfig);
    } catch {
      // Failed to initialize - no-op
    }
  }
  return clientRollbar;
}

/**
 * Log an error from a client component
 * Safe to use in 'use client' components
 */
export function logClientError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const rollbar = getClientRollbar();

  if (!rollbar) {
    // In dev/test mode, log to console
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Fallback when Rollbar unavailable
      console.error('[ClientError]', error, context);
    }
    return;
  }

  try {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    rollbar.error(errorObj, { custom: context });
  } catch {
    // Suppress reporting failures
  }
}

/**
 * Log a warning from a client component
 */
export function logClientWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  const rollbar = getClientRollbar();

  if (!rollbar) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Fallback when Rollbar unavailable
      console.warn('[ClientWarning]', message, context);
    }
    return;
  }

  try {
    rollbar.warning(message, { custom: context });
  } catch {
    // Suppress reporting failures
  }
}
