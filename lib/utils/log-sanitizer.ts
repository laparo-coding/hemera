/**
 * Log Sanitizer
 * Removes or redacts sensitive fields from logging objects to prevent
 * information disclosure (token presence, full URLs, credentials)
 */

/** Maximum recursion depth to prevent stack overflow on deeply nested objects */
const MAX_SANITIZE_DEPTH = 10;

/**
 * Extract safe identifier from full Vercel Blob URL
 * Input: https://xxxxxx.public.blob.vercel-storage.com/path/to/file
 * Output: {pathname: "path/to/file", domain: "*.public.blob.vercel-storage.com"}
 */
function extractBlobIdentifier(blobUrl: string): {
  pathname: string;
  domain: string;
} {
  try {
    const url = new URL(blobUrl);
    const pathname = url.pathname.replace(/^\//, '');
    return {
      pathname,
      domain: url.hostname.replace(/^[^.]+/, '*'),
    };
  } catch {
    return { pathname: 'invalid-url', domain: 'invalid-domain' };
  }
}

/**
 * Redact full URLs to show only domain + pathname
 */
function redactUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return '[invalid-url]';
  }
}

/**
 * Factory that creates a recursive array sanitizer from an element sanitizer.
 * Handles nested arrays automatically, passing depth and visited tracking through.
 */
type ElementSanitizer = (
  obj: Record<string, unknown>,
  depth: number,
  visited: WeakSet<object>
) => Record<string, unknown>;

function createArraySanitizer(
  sanitizeElement: ElementSanitizer
): (arr: unknown[], depth: number, visited: WeakSet<object>) => unknown[] {
  const sanitizeArray = (
    arr: unknown[],
    depth: number,
    visited: WeakSet<object>
  ): unknown[] => {
    return arr.map(item => {
      if (Array.isArray(item)) return sanitizeArray(item, depth + 1, visited);
      if (typeof item === 'object' && item !== null)
        return sanitizeElement(
          item as Record<string, unknown>,
          depth + 1,
          visited
        );
      return item;
    });
  };
  return sanitizeArray;
}

// --- Internal implementations with depth/circular tracking ---

function sanitizeLoggingObjectInternal(
  obj: Record<string, unknown>,
  depth: number,
  visited: WeakSet<object>
): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {};
  if (depth > MAX_SANITIZE_DEPTH) return { _truncated: '[MaxDepth]' };
  if (visited.has(obj)) return { _circular: '[Circular]' };
  visited.add(obj);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields entirely
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('credential') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('apikey') ||
      key.toLowerCase().includes('authorization') ||
      key.toLowerCase().includes('cookie') ||
      key.toLowerCase().includes('session')
    ) {
      continue;
    }

    // Redact full URLs to show only domain + pathname
    if (key.toLowerCase().includes('url') && typeof value === 'string') {
      sanitized[key] = redactUrl(value);
      continue;
    }

    // Include safe fields
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
      continue;
    }

    // Handle arrays - recursively sanitize array elements
    if (Array.isArray(value)) {
      sanitized[key] = sanitizeLoggingArr(
        value as unknown[],
        depth + 1,
        visited
      );
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object') {
      sanitized[key] = sanitizeLoggingObjectInternal(
        value as Record<string, unknown>,
        depth + 1,
        visited
      );
    }
  }

  return sanitized;
}

const sanitizeLoggingArr = createArraySanitizer(sanitizeLoggingObjectInternal);

/**
 * Remove sensitive fields from a logging object
 * Safe to use for Rollbar and other log aggregation systems
 */
export function sanitizeLoggingObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  return sanitizeLoggingObjectInternal(obj, 0, new WeakSet());
}

/**
 * Safe logging version for blob URLs
 * Redacts the full URL and pathname to prevent PII leakage.
 * Returns only the top-level category (first path segment) and domain.
 */
export function sanitizeBlobUrlField(blobUrl: string | undefined | null): {
  blobPathname: string;
  blobDomain: string;
} | null {
  if (!blobUrl) return null;

  const identifier = extractBlobIdentifier(blobUrl);
  // Only expose the top-level category (e.g., "course-material", "resumes")
  // to avoid leaking participationId or filenames from deeper path segments
  const firstSegment = identifier.pathname.split('/').filter(Boolean)[0] || '';
  return {
    blobPathname: firstSegment ? `${firstSegment}/...` : '',
    blobDomain: identifier.domain,
  };
}

function sanitizeAuditLogDetailsInternal(
  details: Record<string, unknown>,
  depth: number,
  visited: WeakSet<object>
): Record<string, unknown> {
  if (!details || typeof details !== 'object') return { _value: details };
  if (depth > MAX_SANITIZE_DEPTH) return { _truncated: '[MaxDepth]' };
  if (visited.has(details)) return { _circular: '[Circular]' };
  visited.add(details);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();

    // Replace blob URLs with safe per-field identifiers
    if (lowerKey.includes('bloburl') && typeof value === 'string') {
      const identifier = extractBlobIdentifier(value);
      sanitized[`${key}Pathname`] = identifier.pathname;
      sanitized[`${key}Domain`] = identifier.domain;
      continue;
    }

    // Skip sensitive fields entirely (case-insensitive substring matching)
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('credential') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('privatekey') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('cookie') ||
      lowerKey.includes('session')
    ) {
      continue;
    }

    // Safe primitive types
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
      continue;
    }

    // Handle arrays - recursively sanitize array elements
    if (Array.isArray(value)) {
      sanitized[key] = sanitizeAuditArr(value as unknown[], depth + 1, visited);
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object') {
      sanitized[key] = sanitizeAuditLogDetailsInternal(
        value as Record<string, unknown>,
        depth + 1,
        visited
      );
    }
  }

  return sanitized;
}

const sanitizeAuditArr = createArraySanitizer(sanitizeAuditLogDetailsInternal);

/**
 * Sanitize audit log details before spreading to monitoring systems
 * Filters out or redacts sensitive fields that should not be exposed
 */
export function sanitizeAuditLogDetails(
  details: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  return sanitizeAuditLogDetailsInternal(details, 0, new WeakSet());
}

/**
 * Default safe audit fields that can be logged without sanitization
 * Extend this list if additional audit fields are needed
 */
const SAFE_AUDIT_FIELDS = new Set([
  'id',
  'userId',
  'resourceId',
  'action',
  'resourceType',
  'status',
  'timestamp',
  'error',
  'message',
  'details',
  'requestId',
]);

/**
 * Filter audit event data to only safe fields before spreading to Rollbar
 */
export function filterAuditEvent(
  auditEvent: Record<string, unknown>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(auditEvent)) {
    if (SAFE_AUDIT_FIELDS.has(key)) {
      // For details field, apply additional sanitization
      if (
        key === 'details' &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        filtered[key] = sanitizeAuditLogDetails(
          value as Record<string, unknown>
        );
      } else if (key === 'error' && typeof value === 'string') {
        // Truncate error messages and strip stack traces
        const firstLine = value.split('\n')[0] ?? value;
        filtered[key] =
          firstLine.length > 200 ? `${firstLine.slice(0, 200)}…` : firstLine;
      } else {
        filtered[key] = value;
      }
    }
  }

  return filtered;
}
