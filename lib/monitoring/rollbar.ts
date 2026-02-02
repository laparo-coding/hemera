/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * Please import directly from './rollbar-official.ts' instead.
 * 
 * All Rollbar exports have been consolidated into rollbar-official.ts
 * to maintain a single source of truth and prevent import drift.
 */

// Re-export everything from the official module
// This ensures any accidental imports from the old path still work
// but encourages migration to the correct import path
export {
  clientConfig,
  serverInstance,
  rollbar,
  rollbarConfig,
  clientRollbarConfig,
  ErrorSeverity,
  type ErrorSeverityType,
  type ErrorContext,
  createErrorContext,
  reportError,
  recordUserAction,
  flushRollbar,
} from './rollbar-official';
