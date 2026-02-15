/**
 * Rollbar Configuration following official Next.js documentation
 * https://docs.rollbar.com/docs/nextjs
 *
 * SECURITY: Rollbar SDK is only initialized when:
 * 1. Not in test/E2E mode
 * 2. Not explicitly disabled via env flags
 * 3. Valid access token is present (prevents accidental initialization)
 *
 * This prevents secret misuse and unexpected network calls in serverless/edge contexts.
 */

import Rollbar from 'rollbar';
import { isTelemetryConsentGranted } from './privacy';

interface RollbarTestInstance {
  critical: () => void;
  error: () => void;
  warning: () => void;
  warn: () => void;
  info: () => void;
  debug: () => void;
  log: () => void;
  wait: (cb?: () => void) => void;
}

// ============================================================================
// Runtime Validation & Configuration
// ============================================================================

/**
 * Find an environment variable by prefix.
 * The Vercel-Rollbar integration creates env vars with timestamp suffixes
 * (e.g. ROLLBAR_HEMERA_SERVER_TOKEN_1769716944). This helper resolves the
 * exact name first, then falls back to any key starting with the prefix.
 */
function findEnvByPrefix(...prefixes: string[]): string | undefined {
  // 1) Check exact matches first (fastest path)
  for (const prefix of prefixes) {
    const exact = process.env[prefix];
    if (exact && exact.trim().length > 0) return exact;
  }

  // 2) Search for Vercel-Rollbar integration keys (PREFIX_<timestamp>)
  const allKeys = Object.keys(process.env);
  for (const prefix of prefixes) {
    const pattern = `${prefix}_`;
    for (const key of allKeys) {
      // Skip deleted variables (Vercel marks them with "(DELETED)_" prefix)
      if (key.startsWith('(DELETED)')) continue;
      if (key.startsWith(pattern) && key !== prefix) {
        const val = process.env[key];
        if (val && val.trim().length > 0) return val;
      }
    }
  }

  return undefined;
}

// Enablement rules unify various legacy flags used across the repo/scripts
const isE2EMode = process.env.E2E_TEST === '1';
const isTestMode =
  process.env.NODE_ENV === 'test' ||
  // Jest sets JEST_WORKER_ID for each worker process
  typeof process.env.JEST_WORKER_ID !== 'undefined';
const isExplicitlyDisabled =
  process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
  process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '0' ||
  process.env.ROLLBAR_ENABLED === '0';

/** Minimum length for Rollbar tokens to be considered valid */
const MIN_TOKEN_LENGTH = 20;

/**
 * Validate that a Rollbar token is present, non-empty, and meets minimum length
 */
function isValidToken(token: string | undefined, label: string): boolean {
  if (!token || token.trim().length === 0) {
    return false;
  }
  if (token.length < MIN_TOKEN_LENGTH) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint: Configuration warning in development
      console.warn(
        `[rollbar] ${label} is too short (expected ${MIN_TOKEN_LENGTH}+ chars). Rollbar will be disabled.`
      );
    }
    return false;
  }
  return true;
}

/**
 * Validate that Rollbar access token is present and non-empty
 * Returns true if token is valid, false otherwise
 */
function hasValidServerToken(): boolean {
  const token = findEnvByPrefix(
    'ROLLBAR_HEMERA_SERVER_TOKEN',
    'ROLLBAR_SERVER_TOKEN'
  );
  return isValidToken(token, 'Server token');
}

/**
 * Validate that Rollbar client token is present and non-empty
 */
function hasValidClientToken(): boolean {
  const token = findEnvByPrefix(
    'NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN',
    'NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN'
  );
  return isValidToken(token, 'Client token');
}

/**
 * Check if Rollbar should be enabled based on environment and configuration
 */
function shouldEnableRollbar(): boolean {
  // Never enable in E2E mode (but allow test mode for unit testing)
  if (isE2EMode) {
    return false;
  }

  // Respect explicit disable flags
  if (isExplicitlyDisabled) {
    return false;
  }

  // Require valid server token (prevents accidental initialization without credentials)
  if (!hasValidServerToken()) {
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint: Configuration info in development
      console.info(
        '[rollbar] No valid server token found. Rollbar error tracking is disabled. Set ROLLBAR_HEMERA_SERVER_TOKEN to enable.'
      );
    }
    return false;
  }

  return true;
}

function readNumberEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Determine the Rollbar environment based on Vercel deployment context.
 * - production: Vercel production deployment
 * - preview: Vercel preview deployment (PRs, branches)
 * - development: Local development or fallback
 */
function getRollbarEnvironment(): string {
  // Server-side: VERCEL_ENV is set by Vercel
  // Client-side: NEXT_PUBLIC_VERCEL_ENV is the public version
  return (
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV ||
    'development'
  );
}

const rollbarEnabled = shouldEnableRollbar();

// In test mode, we re-check enabled status at runtime to handle env changes between tests
// This allows validation tests (that delete tokens) to work while sampling tests can still run
const effectiveEnabled = isTestMode ? shouldEnableRollbar() : rollbarEnabled;

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: getRollbarEnvironment(),
  enabled: effectiveEnabled,
  // Sampling defaults: 100% errors, ~5% non-errors (overridable)
  // Rollbar's server SDK supports 'reportLevel' and custom filtering via payload handlers,
  // we emulate simple sampling by filtering in our helpers (see below).
};

// Client-side configuration (for React components)
// Uses Vercel-Rollbar integration token name
// Only include token if validation passes
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

// ============================================================================
// Server-side Instance (Lazy Initialization)
// ============================================================================

// No-op instance for test mode or when Rollbar is disabled
const noOpInstance: RollbarTestInstance = {
  critical: () => {
    /* no-op */
  },
  error: () => {
    /* no-op */
  },
  warning: () => {
    /* no-op */
  },
  warn: () => {
    /* no-op */
  },
  info: () => {
    /* no-op */
  },
  debug: () => {
    /* no-op */
  },
  log: () => {
    /* no-op */
  },
  wait: (cb?: () => void) => {
    if (typeof cb === 'function') cb();
  },
};

// Server-side instance (for API routes and server components)
// Only initialize Rollbar if enabled and token is valid
// In test mode, use effectiveEnabled to allow testing even without token
const instanceEnabled = isTestMode ? effectiveEnabled : rollbarEnabled;
export const serverInstance: Rollbar | RollbarTestInstance = instanceEnabled
  ? new Rollbar({
      accessToken: findEnvByPrefix(
        'ROLLBAR_HEMERA_SERVER_TOKEN',
        'ROLLBAR_SERVER_TOKEN'
      ),
      ...baseConfig,
    })
  : noOpInstance;

// Legacy compatibility - keeping old configuration exports
// Uses Vercel-Rollbar integration token name with fallback
export const rollbarConfig = {
  accessToken: findEnvByPrefix(
    'ROLLBAR_HEMERA_SERVER_TOKEN',
    'ROLLBAR_SERVER_TOKEN'
  ),
  ...baseConfig,
};

export const rollbar = serverInstance;

// Client-side configuration with legacy fallback
// Uses Vercel-Rollbar integration token name with fallback
export const clientRollbarConfig = {
  accessToken: findEnvByPrefix(
    'NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN',
    'NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN'
  ),
  ...baseConfig,
};

// ---- Compatibility helpers (legacy API surfaced via official instance) ----

export const ErrorSeverity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type ErrorSeverityType =
  (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  route?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
  additionalData?: Record<string, unknown>;
}

export function createErrorContext(
  request?: Request,
  userId?: string,
  requestId?: string
): ErrorContext {
  return {
    userId,
    requestId,
    route: request ? new URL(request.url).pathname : undefined,
    method: request?.method,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip:
      request?.headers.get('x-forwarded-for') ||
      request?.headers.get('x-real-ip') ||
      undefined,
    timestamp: new Date(),
  };
}

export function reportError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverityType = ErrorSeverity.ERROR
): void {
  // Never report in E2E mode to avoid polluting production telemetry
  if (isE2EMode) return;

  // If explicitly disabled via env flags, skip entirely (even in tests)
  // In test mode, re-check at runtime to handle env changes between tests
  if (isExplicitlyDisabled) return;

  // Dynamically check if Rollbar should be enabled at runtime
  const currentlyEnabled = shouldEnableRollbar();
  if (!currentlyEnabled) return;

  try {
    // Simple sampling: allow configuring rate per severity (0..1)
    const rateAll = readNumberEnv('ROLLBAR_SAMPLE_RATE_ALL', 1);
    const rateInfo = readNumberEnv('ROLLBAR_SAMPLE_RATE_INFO', 0.05);
    const rateWarn = readNumberEnv('ROLLBAR_SAMPLE_RATE_WARN', 0.05);
    const rateError = readNumberEnv('ROLLBAR_SAMPLE_RATE_ERROR', 1);
    const rateCritical = readNumberEnv('ROLLBAR_SAMPLE_RATE_CRITICAL', 1);

    const pick = (rate: number) =>
      Math.random() < Math.max(0, Math.min(1, rate)) && Math.random() < rateAll;

    const includePII = isTelemetryConsentGranted();

    // Sanitize additionalData to avoid leaking raw error messages or PII
    const rawAdditional = context?.additionalData ?? {};
    const sanitizedAdditional: Record<string, unknown> = { ...rawAdditional };

    // Redact commonly abused keys that may contain raw error text or PII
    const keysToRedact = [/originalError/i, /^error$/i, /^errorMessage$/i];
    for (const k of Object.keys(sanitizedAdditional)) {
      if (keysToRedact.some(rx => rx.test(k))) {
        sanitizedAdditional[k] = '[redacted]';
      }
    }

    const rollbarContext: Record<string, unknown> = {
      person:
        includePII && context?.userId
          ? { id: context.userId, email: context.userEmail }
          : undefined,
      request: {
        id: context?.requestId,
        url: context?.route,
        method: context?.method,
        user_ip: context?.ip,
        headers: { 'User-Agent': context?.userAgent },
      },
      custom: {
        timestamp: context?.timestamp?.toISOString(),
        ...sanitizedAdditional,
      },
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        if (pick(rateCritical)) serverInstance.critical(error, rollbarContext);
        break;
      case ErrorSeverity.ERROR:
        if (pick(rateError)) serverInstance.error(error, rollbarContext);
        break;
      case ErrorSeverity.WARNING:
        if (pick(rateWarn)) serverInstance.warning(error, rollbarContext);
        break;
      case ErrorSeverity.INFO:
        if (pick(rateInfo)) serverInstance.info(error, rollbarContext);
        break;
      case ErrorSeverity.DEBUG:
        if (pick(rateInfo)) serverInstance.debug?.(error, rollbarContext);
        break;
      default:
        if (pick(rateError)) serverInstance.error(error, rollbarContext);
    }
  } catch {
    // Suppress any reporting failures
  }
}

export function recordUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  if (!baseConfig.enabled) return;
  try {
    const includePII = isTelemetryConsentGranted();
    serverInstance.info(`User Action: ${action}`, {
      person: includePII && userId ? { id: userId } : undefined,
      custom: {
        action,
        userAction: true,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  } catch {
    // no-op
  }
}

export function flushRollbar(): Promise<void> {
  return new Promise(resolve => {
    if (!baseConfig.enabled) return resolve();
    try {
      serverInstance.wait(() => resolve());
    } catch {
      resolve();
    }
  });
}
