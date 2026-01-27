# Loops Email Service - Configuration Guards

## Overview

This document describes the protection mechanisms that prevent email sending attempts when `LOOPS_API_KEY` is unset, avoiding failing external calls and preventing operational context leakage.

**Feature:** 021-learning-path  
**Last Updated:** 2026-01-27

---

## Problem Statement

Without proper guards, the email service could:
1. ❌ Attempt to instantiate `LoopsClient` without API key → internal errors
2. ❌ Make unnecessary API calls to Clerk (fetching admin emails) → external dependency failure
3. ❌ Leak operational context (which admins exist, booking details) in error logs
4. ❌ Create confusing error messages for developers in non-production environments

---

## Protection Strategy

### Layer 1: Configuration Check (No I/O)

**Function:** `isLoopsConfigured()`  
**File:** `lib/services/loops.ts`

```typescript
export function isLoopsConfigured(): boolean {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    serverInstance.warn('Loops email service not configured', {
      context: 'LoopsService.isLoopsConfigured',
      message: 'LOOPS_API_KEY environment variable is missing - email functionality disabled',
    });
    return false;
  }
  return true;
}
```

**Purpose:**
- ✅ Fast check (no I/O, only environment variable read)
- ✅ Logs warning once per call for visibility
- ✅ Returns `false` to signal callers to skip email operations

---

### Layer 2: Client Instantiation Guard

**Function:** `getLoopsClient()`  
**File:** `lib/services/loops.ts`

```typescript
function getLoopsClient(): LoopsClient | null {
  const apiKey = process.env.LOOPS_API_KEY;

  if (!apiKey) {
    return null; // ✅ Never instantiate LoopsClient without key
  }

  return new LoopsClient(apiKey);
}
```

**Purpose:**
- ✅ Prevents `new LoopsClient()` construction without valid API key
- ✅ Returns `null` to signal unavailability
- ✅ No logging here (handled by `isLoopsConfigured()`)

---

### Layer 3: Email Function Guards

Both email functions check configuration **before** making any external calls:

#### sendPrerequisiteReviewEmail

**File:** `lib/services/loops.ts`

```typescript
export async function sendPrerequisiteReviewEmail(data: {...}): Promise<LoopsEmailResult> {
  // Guard 1: Validate email format (no I/O)
  if (!isValidEmail(data.customerEmail)) {
    serverInstance.warn('Email send skipped - invalid recipient', {...});
    return { success: false, error: 'Invalid or missing customer email' };
  }

  // Guard 2: Check Loops configuration (no I/O)
  if (!isLoopsConfigured()) {
    serverInstance.warn('Email send skipped - service not configured', {...});
    return { success: false, error: 'Email service not configured' };
  }

  // Guard 3: Check admin emails exist
  if (data.adminEmails.length === 0) {
    serverInstance.warn('Email send skipped - no admin emails', {...});
    return { success: false, error: 'No admin emails configured' };
  }

  // Guard 4: Explicit null-check on client
  const loops = getLoopsClient();
  if (!loops) {
    serverInstance.error('Loops client is null despite isLoopsConfigured check', {...});
    return { success: false, error: 'Email service configuration error' };
  }

  // Only now: Make actual API call to Loops
  const results = await Promise.all(
    data.adminEmails.map(email => loops.sendTransactionalEmail({...}))
  );
}
```

**Protection Sequence:**
1. ✅ Email validation (instant)
2. ✅ Config check (instant)
3. ✅ Admin emails check (data already fetched upstream)
4. ✅ Client null-check (defense-in-depth)
5. ✅ Only then: External API call

#### sendBookingRejectedEmail

**File:** `lib/services/loops.ts`

```typescript
export async function sendBookingRejectedEmail(data: {...}): Promise<LoopsEmailResult> {
  // Guard 1: Validate email format (no I/O)
  if (!isValidEmail(data.customerEmail)) {
    serverInstance.warn('Email send skipped - invalid recipient', {...});
    return { success: false, error: 'Invalid or missing customer email' };
  }

  // Guard 2: Check Loops configuration (no I/O)
  if (!isLoopsConfigured()) {
    serverInstance.warn('Email send skipped - service not configured', {...});
    return { success: false, error: 'Email service not configured' };
  }

  // Guard 3: Explicit null-check on client
  const loops = getLoopsClient();
  if (!loops) {
    serverInstance.error('Loops client is null despite isLoopsConfigured check', {...});
    return { success: false, error: 'Email service configuration error' };
  }

  // Only now: Make actual API call to Loops
  const result = await loops.sendTransactionalEmail({...});
}
```

**Protection Sequence:**
1. ✅ Email validation (instant)
2. ✅ Config check (instant)
3. ✅ Client null-check (defense-in-depth)
4. ✅ Only then: External API call

---

### Layer 4: Orchestrator Guards

**Function:** `notifyAdminsForReview()` in `booking-orchestrator.ts`

```typescript
async function notifyAdminsForReview(params: {...}) {
  // Guard 1: Validate email format (no I/O)
  if (!isValidEmail(userEmail)) {
    serverInstance.warn('Skipped prerequisite review email - invalid customer email', {...});
    return;
  }

  // Guard 2: Check Loops configuration (no I/O)
  if (!isLoopsConfigured()) {
    serverInstance.warn('Skipped prerequisite review email - Loops not configured', {...});
    return; // ✅ CRITICAL: Exit BEFORE getAdminEmails() (Clerk API call)
  }

  // Only now: Fetch admin emails from Clerk (external API call)
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    serverInstance.warn('Skipped prerequisite review email - no admin emails', {...});
    return;
  }

  // Send email
  await sendPrerequisiteReviewEmail({...});
}
```

**Critical Protection:**
- ✅ **`isLoopsConfigured()` check BEFORE `getAdminEmails()`**
- ✅ Prevents unnecessary Clerk API call when email service is disabled
- ✅ Avoids leaking admin user information when Loops is not configured

---

## Operational Context Protection

### What Gets Logged When LOOPS_API_KEY is Missing

**Safe Logs (Generic Context Only):**
```typescript
serverInstance.warn('Loops email service not configured', {
  context: 'LoopsService.isLoopsConfigured',
  message: 'LOOPS_API_KEY environment variable is missing - email functionality disabled',
});
```

**What is NOT logged:**
- ❌ Admin email addresses (not fetched)
- ❌ Customer email addresses (masked if logged)
- ❌ Booking IDs (only in orchestrator, minimal context)
- ❌ Course names (not in config check logs)
- ❌ API error responses (no API call made)

---

## Error Sanitization Strategy

### Problem: Unsafe Error Logging

Error objects from external APIs can contain:
- 🔴 Authorization headers with tokens
- 🔴 API response bodies with sensitive data
- 🔴 Database connection strings
- 🔴 Stack traces with system paths
- 🔴 Request payloads with PII

### Solution: sanitizeError() Function

**File:** `lib/services/loops.ts`

```typescript
/**
 * Sanitize error for logging - extract only safe fields, exclude headers/tokens.
 * Never logs full error objects that might contain API responses.
 */
function sanitizeError(error: unknown): { type: string; message: string } {
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }
  return {
    type: 'UnknownError',
    message: String(error),
  };
}
```

**Usage Pattern:**

```typescript
// ❌ UNSAFE: Logs full error with potential tokens/headers
catch (error) {
  reportError(error as Error, { additionalData: {...} });
}

// ✅ SAFE: Sanitize before logging
catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.name : 'UnknownError';
  
  reportError(new Error(`Operation failed: ${errorMessage}`), {
    additionalData: { 
      context: 'Service.operation',
      errorType,
      // Never include: error, error.stack, error.response, etc.
    },
  });
}
```

### Protected Functions

All error handling in email-related services uses sanitization:

1. **getAdminEmails()** - Clerk API errors sanitized
2. **sendPrerequisiteReviewEmail()** - Loops API errors sanitized
3. **sendBookingRejectedEmail()** - Loops API errors sanitized
4. **isUserOutperformer()** - Database errors sanitized
5. **checkPrerequisite()** - Database errors sanitized

### What Gets Logged on Email Failure

**sendPrerequisiteReviewEmail error:**
```typescript
serverInstance.error('Failed to send prerequisite review email', {
  context: 'LoopsService.sendPrerequisiteReviewEmail',
  bookingId: 'abc123',
  recipientCount: 2,
  errorType: 'NetworkError',           // ✅ Safe: error.name only
  errorMessage: 'Request timeout',     // ✅ Safe: error.message only
});
```

**What is NOT logged:**
- ❌ `error` object itself
- ❌ `error.stack` (stack traces)
- ❌ `error.response` (API response bodies)
- ❌ `error.config` (request configurations)
- ❌ `error.request` (request details with headers)
- ❌ Admin email addresses (masked)
- ❌ Full customer email (masked as `j***e@example.com`)

---

## Test Coverage

### Unit Tests: Configuration Guards

**File:** `tests/unit/loops-sanitization.spec.ts`

```typescript
describe('isLoopsConfigured', () => {
  it('should return false when LOOPS_API_KEY is not set', () => {
    delete process.env.LOOPS_API_KEY;
    expect(isLoopsConfigured()).toBe(false);
  });

  it('should return false when LOOPS_API_KEY is empty string', () => {
    process.env.LOOPS_API_KEY = '';
    expect(isLoopsConfigured()).toBe(false);
  });

  it('should return true when LOOPS_API_KEY is set', () => {
    process.env.LOOPS_API_KEY = 'test_key_123';
    expect(isLoopsConfigured()).toBe(true);
  });
});
```

### Unit Tests: Email Sending Guards

```typescript
describe('sendPrerequisiteReviewEmail', () => {
  it('should skip email and return error when Loops is not configured', async () => {
    delete process.env.LOOPS_API_KEY;
    
    const result = await sendPrerequisiteReviewEmail({
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      courseName: 'Advanced Course',
      courseLevel: 'ADVANCED',
      missingPrerequisite: 'INTERMEDIATE',
      bookingId: 'test-123',
      adminEmails: ['admin@example.com'],
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not configured');
  });
});
```

### Test Results

```bash
$ npm test -- loops-sanitization.spec.ts

PASS tests/unit/loops-sanitization.spec.ts
  Loops Email Service Guards
    isLoopsConfigured
      ✓ should return false when LOOPS_API_KEY is not set
      ✓ should return false when LOOPS_API_KEY is empty string
      ✓ should return true when LOOPS_API_KEY is set
    sendPrerequisiteReviewEmail
      ✓ should skip email and return error when Loops is not configured
      ✓ should skip email when admin emails array is empty
    sendBookingRejectedEmail
      ✓ should skip email and return error when Loops is not configured
      ✓ should skip email when customer email is invalid

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

---

## Development Workflow

### Local Development (No LOOPS_API_KEY)

**Expected Behavior:**
1. ✅ Application runs normally
2. ✅ Bookings can be created (PRE_BOOKED status)
3. ✅ Email operations silently skip with warnings in logs
4. ✅ No external API calls to Loops or Clerk for email operations
5. ✅ No crashes or thrown exceptions

**Log Output:**
```
[WARN] Loops email service not configured
  context: LoopsService.isLoopsConfigured
  message: LOOPS_API_KEY environment variable is missing - email functionality disabled

[WARN] Skipped prerequisite review email - Loops not configured
  context: BookingOrchestrator.notifyAdminsForReview
  bookingId: abc123
  userId: user_xyz
```

### Staging/Production (LOOPS_API_KEY Set)

**Expected Behavior:**
1. ✅ All guards pass configuration checks
2. ✅ External API calls to Loops proceed normally
3. ✅ `getAdminEmails()` fetches admin list from Clerk
4. ✅ Emails sent to admins and customers
5. ✅ Full logging with masked PII

---

## Security Checklist

When modifying email functionality:

- [ ] **Configuration Check First**: Always call `isLoopsConfigured()` before external operations
- [ ] **No Premature I/O**: Don't fetch admin emails or user data before config check
- [ ] **Explicit Null Checks**: Use `if (!loops)` after `getLoopsClient()`, not just `!` operator
- [ ] **Silent Degradation**: Return `{ success: false, error: '...' }`, never throw
- [ ] **Sanitize All Errors**: Extract only `error.name` and `error.message`, never log full error objects
- [ ] **Safe Logging**: Log only generic context, mask all PII (emails, names, IDs)
- [ ] **No API Responses**: Never log `error.response`, `error.config`, or `error.request`
- [ ] **Test Coverage**: Add test case with `delete process.env.LOOPS_API_KEY`

---

## Common Mistakes to Avoid

### ❌ DON'T: Call getAdminEmails() before checking config

```typescript
// ❌ WRONG: External Clerk API call before checking Loops config
const adminEmails = await getAdminEmails();
if (!isLoopsConfigured()) {
  return;
}
```

### ✅ DO: Check config first, then fetch data

```typescript
// ✅ CORRECT: Config check prevents unnecessary external call
if (!isLoopsConfigured()) {
  return;
}
const adminEmails = await getAdminEmails();
```

### ❌ DON'T: Use non-null assertion after isLoopsConfigured()

```typescript
// ❌ RISKY: Assumes getLoopsClient() never returns null
if (!isLoopsConfigured()) return;
const loops = getLoopsClient()!; // Could still be null in edge cases
```

### ✅ DO: Explicit null check for defense-in-depth

```typescript
// ✅ CORRECT: Explicit null check prevents runtime errors
if (!isLoopsConfigured()) return;
const loops = getLoopsClient();
if (!loops) {
  serverInstance.error('Client null despite config check');
  return { success: false, error: 'Configuration error' };
}
```

---

## Related Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) - PRE_BOOKED review workflow
- [Workflow Documentation](./PRE_BOOKED_APPROVAL_WORKFLOW.md) - Complete feature overview
- [Error Handling](../../monitoring/rollbar-integration.md) - Rollbar logging patterns

---

## Maintenance Notes

**When to update this document:**
1. Adding new email notification types
2. Changing configuration validation logic
3. Adding new external service dependencies (beyond Loops/Clerk)
4. Modifying guard placement in orchestrator
5. Changing logging patterns for unconfigured services

**Review Schedule:** Quarterly or after major email feature changes

**Last Reviewed:** 2026-01-27  
**Next Review:** Q2 2026 or after 022-* feature
