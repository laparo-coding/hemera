/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * Please import directly from:
 *   - './rollbar-official.ts' for server-side code
 *   - './rollbar-client-config.ts' for client-side code
 *
 * All Rollbar exports have been split to prevent client bundling of server-only code
 */

// Re-export client-safe exports from client config
export {
  clientConfig,
  ErrorSeverity,
  type ErrorSeverityType,
} from './rollbar-client-config';
// Re-export everything from the official server module
export {
  clientRollbarConfig,
  createErrorContext,
  type ErrorContext,
  flushRollbar,
  recordUserAction,
  reportError,
  rollbar,
  rollbarConfig,
  serverInstance,
} from './rollbar-official';
