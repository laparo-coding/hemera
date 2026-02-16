# SDK Initialization Security

## Overview

This document describes the security measures implemented to prevent accidental SDK initialization in serverless/edge contexts without proper configuration. These measures protect against secret misuse and unexpected network calls.

**Secured SDKs:**
- Rollbar (error monitoring)
- Upstash Redis/Ratelimit (distributed rate limiting)
- Context7 (AI context retrieval)

### Context7 (AI context retrieval)

Context7 is an optional SDK used for AI-powered context retrieval. Security measures for Context7 mirror other external SDKs:

- Explicit opt-in via `CONTEXT7_ENABLED=1`.
- API key validation (non-empty, expected prefix `ctx7sk_` or similar).
- Disabled in `NODE_ENV=test` and E2E modes.
- Lazy initialization via singleton pattern (Node.js single-threaded execution makes a simple null-check sufficient).
- Try-catch error handling in `searchLibrary()` and `getContext()` — SDK failures return `null` instead of throwing.
- Rate-limited calls and sanitized results before persisting or logging.
- Named exports only (no default export) for tree-shaking and explicit imports.

Configuration example:
```bash
CONTEXT7_ENABLED=1
CONTEXT7_API_KEY=ctx7sk_...
```

## Problem Statement

External SDKs can accidentally initialize in serverless/edge contexts if:
1. No explicit enable flag is required (auto-activation based on env var presence)
2. No runtime validation of credentials (malformed tokens accepted)
3. Module-level initialization (eager loading instead of lazy)
4. No guards for test/E2E environments

This can lead to:
- Secret misuse (tokens sent to wrong endpoints)
- Unexpected network calls (cost, latency, errors)
- Memory leaks (timers/intervals in serverless)
- Test pollution (real API calls in test suites)

## Implemented Solutions

### 1. Rollbar SDK (`lib/monitoring/rollbar-official.ts`)

#### Security Measures

**Token Validation:**
- Requires valid server token (20+ characters minimum)
- Validates token presence before initialization
- Falls back to no-op instance if token invalid/missing

**Environment Guards:**
- Automatically disabled in test mode (`NODE_ENV=test`)
- Automatically disabled in E2E mode (`E2E_TEST=1`)
- Respects explicit disable flags (`ROLLBAR_ENABLED=0`)

**Lazy Initialization:**
- SDK only initialized when all conditions met:
  1. Not in test/E2E mode
  2. Not explicitly disabled
  3. Valid token present

**Configuration:**
```bash
# Required for Rollbar to initialize
ROLLBAR_HEMERA_SERVER_TOKEN=<valid-token-20+-chars>

# Optional: Explicit disable (overrides token presence)
ROLLBAR_ENABLED=0
```

#### Code Example

```typescript
// Before: Eager initialization (risky)
export const serverInstance = new Rollbar({
  accessToken: process.env.ROLLBAR_SERVER_TOKEN,
  enabled: true,
});

// After: Guarded initialization (safe)
const rollbarEnabled = shouldEnableRollbar(); // validates token + env
export const serverInstance = rollbarEnabled
  ? new Rollbar({ accessToken: validToken, enabled: true })
  : noOpInstance; // no-op for tests/invalid config
```

### 2. Upstash Redis/Ratelimit (`lib/middleware/rate-limit.ts`)

#### Security Measures

**Explicit Opt-In:**
- Requires `UPSTASH_ENABLED=1` flag (not just URL presence)
- Validates URL format (must start with `https://`)
- Validates token presence and non-empty

**Package Detection:**
- Gracefully handles missing packages (not installed by default)
- Falls back to in-memory rate limiting if packages unavailable

**Serverless Guards:**
- `setInterval` cleanup only runs in long-running Node.js contexts
- Disabled in Vercel serverless (`VERCEL=1`)
- Disabled in AWS Lambda (`AWS_LAMBDA_FUNCTION_NAME` present)
- Disabled in test mode

**Configuration:**
```bash
# Step 1: Install packages (optional)
npm install @upstash/redis @upstash/ratelimit

# Step 2: Enable via explicit flag
UPSTASH_ENABLED=1
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### Code Example

```typescript
// Before: Auto-activation (risky)
if (process.env.UPSTASH_REDIS_REST_URL) {
  const redis = Redis.fromEnv(); // Always initializes if URL present
}

// After: Explicit opt-in (safe)
function isUpstashEnabled(): boolean {
  const enabled = process.env.UPSTASH_ENABLED === '1'; // Explicit flag
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!enabled) return false;
  if (!url || !url.startsWith('https://')) return false;
  if (!token || token.trim().length === 0) return false;

  return true;
}
```

## Environment Variables

### Rollbar

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROLLBAR_HEMERA_SERVER_TOKEN` | Yes (for init) | - | Server-side token (20+ chars) |
| `NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN` | No | - | Client-side token (20+ chars) |
| `ROLLBAR_ENABLED` | No | `1` | Explicit disable: `0` |
| `NEXT_PUBLIC_ROLLBAR_ENABLED` | No | `1` | Client-side disable: `0` |

### Upstash Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UPSTASH_ENABLED` | Yes | `0` | Explicit opt-in: `1` |
| `UPSTASH_REDIS_REST_URL` | Yes (if enabled) | - | HTTPS URL to Redis instance |
| `UPSTASH_REDIS_REST_TOKEN` | Yes (if enabled) | - | Authentication token |

## Testing

### Unit Tests

Run Rollbar validation tests:
```bash
npm run test tests/unit/monitoring/rollbar-validation.spec.ts
```

### Manual Verification

**Test 1: Rollbar without token**
```bash
# Remove token
unset ROLLBAR_HEMERA_SERVER_TOKEN

# Start dev server
npm run dev

# Expected: Console log "[rollbar] No valid server token found. Rollbar error tracking is disabled."
```

**Test 2: Upstash without explicit enable**
```bash
# Set URL/token but no enable flag
export UPSTASH_REDIS_REST_URL=https://example.com
export UPSTASH_REDIS_REST_TOKEN=test
unset UPSTASH_ENABLED

# Start dev server
npm run dev

# Expected: In-memory rate limiting used (no Upstash initialization)
```

**Test 3: Upstash with explicit enable**
```bash
# Enable Upstash
export UPSTASH_ENABLED=1
export UPSTASH_REDIS_REST_URL=https://example.com
export UPSTASH_REDIS_REST_TOKEN=test

# Start dev server
npm run dev

# Expected: Console log "[rate-limit] Upstash packages not installed..." (if packages missing)
# Or: "[rate-limit] Upstash Redis client initialized successfully" (if packages installed)
```

## Best Practices

### For New SDK Integrations

When adding a new external SDK, follow these guidelines:

1. **Explicit Opt-In:**
   - Add `<SDK>_ENABLED=1` flag requirement
   - Don't auto-activate based on credential presence alone

2. **Runtime Validation:**
   - Validate credential format (length, prefix, etc.)
   - Log warnings in development mode for invalid config
   - Fall back to no-op/mock implementation

3. **Environment Guards:**
   - Disable in test mode (`NODE_ENV=test`)
   - Disable in E2E mode (`E2E_TEST=1`)
   - Respect explicit disable flags

4. **Lazy Initialization:**
   - Avoid module-level `new SDK()` calls
   - Use factory functions or singletons
   - Initialize only when all conditions met

5. **Serverless Compatibility:**
   - Avoid `setInterval`/`setTimeout` on module level
   - Check for long-running context before scheduling
   - Clean up resources properly

### Example Template

```typescript
// lib/integrations/new-sdk.ts

// 1. Explicit opt-in check
function isNewSdkEnabled(): boolean {
  const enabled = process.env.NEW_SDK_ENABLED === '1';
  const apiKey = process.env.NEW_SDK_API_KEY;

  if (!enabled) return false;
  if (!apiKey || apiKey.length < 20) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[new-sdk] Invalid API key. SDK disabled.');
    }
    return false;
  }

  return true;
}

// 2. No-op instance for tests/disabled state
const noOpInstance = {
  method: () => Promise.resolve(),
};

// 3. Lazy initialization
let sdkInstance: NewSDK | typeof noOpInstance | null = null;

export function getNewSdkInstance() {
  if (sdkInstance) return sdkInstance;

  if (isNewSdkEnabled()) {
    sdkInstance = new NewSDK({
      apiKey: process.env.NEW_SDK_API_KEY,
    });
  } else {
    sdkInstance = noOpInstance;
  }

  return sdkInstance;
}
```

## Troubleshooting

### Rollbar Not Initializing

**Symptom:** No errors logged to Rollbar dashboard

**Checks:**
1. Verify token is set: `echo $ROLLBAR_HEMERA_SERVER_TOKEN`
2. Verify token length: `echo $ROLLBAR_HEMERA_SERVER_TOKEN | wc -c` (should be 20+)
3. Check disable flags: `echo $ROLLBAR_ENABLED` (should not be `0`)
4. Check environment: `echo $NODE_ENV` (should not be `test`)

### Upstash Not Initializing

**Symptom:** In-memory rate limiting used instead of distributed

**Checks:**
1. Verify enable flag: `echo $UPSTASH_ENABLED` (should be `1`)
2. Verify URL format: `echo $UPSTASH_REDIS_REST_URL` (should start with `https://`)
3. Verify token: `echo $UPSTASH_REDIS_REST_TOKEN` (should be non-empty)
4. Verify packages installed: `npm list @upstash/redis @upstash/ratelimit`

### Unexpected Network Calls in Tests

**Symptom:** Tests making real API calls to external services

**Checks:**
1. Verify test mode: `echo $NODE_ENV` (should be `test`)
2. Check Jest worker: `echo $JEST_WORKER_ID` (should be set during tests)
3. Review SDK initialization logs in test output

### Related Resources

**Documentation**
- [Rollbar Integration](./rollbar-integration.md)
- [Telemetry Reporting Policy](./reporting-policy.md) — PII guardrails and `additionalData` whitelist for `reportError()` calls
- [reportError additionalData Keys](./reportError-additionalData-keys.md)

**Code References**
- [Rate Limiting implementation](../../lib/middleware/rate-limit.ts)
- [check-reporterror-keys.mjs](../../scripts/check-reporterror-keys.mjs) — Automated whitelist enforcement script

**Configuration**
- [Environment Variables example](../../.env.local.example)
- [Testing Guidelines](../tests/e2e.md)

## Changelog

- **2026-02-14:** Initial implementation of SDK initialization security measures
  - Added Rollbar token validation
  - Added Upstash explicit opt-in
  - Added environment guards
  - Added unit tests
