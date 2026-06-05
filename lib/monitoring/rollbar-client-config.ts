/**
 * Rollbar Client Configuration
 *
 * This module contains ONLY the client-side configuration for Rollbar.
 * It is deliberately kept minimal and free of server-only dependencies
 * (like node:crypto) to ensure it can be safely bundled into client code.
 *
 * Server-side functionality (reporting, sampling, server instance) is in
 * rollbar-official.ts and marked with 'server-only'.
 */

import { findEnvByPrefix } from '@/lib/utils/env-prefix';

// ============================================================================
// Runtime Validation & Configuration
// ============================================================================

/**
 * Determine the Rollbar environment based on deployment context.
 * - production: Vercel production deployment or explicit production runtime
 * - preview: Vercel preview deployment (PRs, branches)
 * - development: Local development, test, or fallback
 */
function getRollbarEnvironment(): 'development' | 'preview' | 'production' {
  const vercelEnv = (
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    ''
  ).toLowerCase();

  if (vercelEnv === 'production') {
    return 'production';
  }
  if (vercelEnv === 'preview') {
    return 'preview';
  }
  return 'development';
}

/**
 * Determine if Rollbar should be enabled based on environment flags.
 * Explicit env toggles take precedence over auto-detection.
 */
function shouldEnableRollbar(): boolean {
  if (
    process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '1' ||
    process.env.ROLLBAR_ENABLED === '1'
  ) {
    return true;
  }

  if (
    process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
    process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '0' ||
    process.env.ROLLBAR_ENABLED === '0'
  ) {
    return false;
  }

  // Default: auto-enable in production, disable elsewhere
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate that a token meets minimum security criteria.
 * Returns true only if token is present and reasonably long (>= 20 chars).
 * Rejects obviously fake/placeholder values to prevent accidental leaks.
 */
function hasValidClientToken(): boolean {
  const token = findEnvByPrefix(
    'NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN',
    'NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN'
  );

  if (!token) {
    return false;
  }

  // Minimum length to avoid obviously fake tokens
  const MIN_TOKEN_LENGTH = 20;
  if (token.length < MIN_TOKEN_LENGTH) {
    return false;
  }

  // Reject placeholder/example values
  for (const placeholder of [
    'your-client-token',
    'xxx',
    'test',
    'placeholder',
    'fake',
  ]) {
    if (token.toLowerCase().includes(placeholder.toLowerCase())) {
      return false;
    }
  }

  return true;
}

const rollbarEnabled = shouldEnableRollbar();

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: getRollbarEnvironment(),
  enabled: rollbarEnabled,
};

/**
 * Client-side configuration for Rollbar
 * Safe to use in client components (contains no server-only dependencies)
 */
export const clientConfig = {
  accessToken: hasValidClientToken()
    ? findEnvByPrefix(
        'NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN',
        'NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN'
      )
    : undefined,
  ...baseConfig,
  enabled: rollbarEnabled && hasValidClientToken(),
};

export const ErrorSeverity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type ErrorSeverityType =
  (typeof ErrorSeverity)[keyof typeof ErrorSeverity];
