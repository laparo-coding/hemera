/**
 * Rollbar Configuration following official Next.js documentation
 * https://docs.rollbar.com/docs/nextjs
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

// Enablement rules unify various legacy flags used across the repo/scripts
const isE2EMode = process.env.E2E_TEST === 'true';
const isTestMode =
  process.env.NODE_ENV === 'test' ||
  // Jest sets JEST_WORKER_ID for each worker process
  typeof process.env.JEST_WORKER_ID !== 'undefined';
const isExplicitlyDisabled =
  process.env.NEXT_PUBLIC_DISABLE_ROLLBAR === '1' ||
  process.env.NEXT_PUBLIC_ROLLBAR_ENABLED === '0' ||
  process.env.ROLLBAR_ENABLED === '0';

function readNumberEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const baseConfig = {
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.NODE_ENV,
  enabled: !isE2EMode && !isExplicitlyDisabled,
  // Sampling defaults: 100% errors, ~5% non-errors (overridable)
  // Rollbar's server SDK supports 'reportLevel' and custom filtering via payload handlers,
  // we emulate simple sampling by filtering in our helpers (see below).
};

// Client-side configuration (for React components)
export const clientConfig = {
  accessToken: process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
  ...baseConfig,
};

// Server-side instance (for API routes and server components)
// In test mode, export a no-op instance to avoid network calls.
export const serverInstance: Rollbar | RollbarTestInstance = isTestMode
  ? {
      critical: () => {},
      error: () => {},
      warning: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      log: () => {},
      wait: (cb?: () => void) => {
        if (typeof cb === 'function') cb();
      },
    }
  : new Rollbar({
      // In E2E mode, use a dummy token to prevent initialization errors
      accessToken: isE2EMode
        ? 'dummy-token-for-e2e'
        : process.env.ROLLBAR_SERVER_TOKEN,
      ...baseConfig,
    });

// Legacy compatibility - keeping old configuration exports
export const rollbarConfig = {
  accessToken:
    process.env.ROLLBAR_SERVER_TOKEN || process.env.ROLLBAR_SERVER_ACCESS_TOKEN,
  ...baseConfig,
};

export const rollbar = serverInstance;

// Client-side configuration with legacy fallback
export const clientRollbarConfig = {
  accessToken:
    process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN ||
    process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_ACCESS_TOKEN,
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
  if (!baseConfig.enabled) return;

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
        ...context?.additionalData,
      },
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        if (pick(rateCritical))
          serverInstance.critical(error as any, rollbarContext);
        break;
      case ErrorSeverity.ERROR:
        if (pick(rateError)) serverInstance.error(error as any, rollbarContext);
        break;
      case ErrorSeverity.WARNING:
        if (pick(rateWarn))
          serverInstance.warning(error as any, rollbarContext);
        break;
      case ErrorSeverity.INFO:
        if (pick(rateInfo)) serverInstance.info(error as any, rollbarContext);
        break;
      case ErrorSeverity.DEBUG:
        if (pick(rateInfo))
          serverInstance.debug?.(error as any, rollbarContext);
        break;
      default:
        if (pick(rateError)) serverInstance.error(error as any, rollbarContext);
    }
  } catch {
    // Suppress any reporting failures
  }
}

export function recordUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
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
