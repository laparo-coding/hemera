/**
 * Request ID utilities for tracking requests across the application
 */
import type { NextRequest } from 'next/server';

interface GlobalWithCrypto {
  crypto?: {
    randomUUID?: () => string;
    getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
  };
}

/**
 * Generate a unique request ID (RFC4122 v4 UUID preferred)
 */
export function generateRequestId(): string {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as GlobalWithCrypto).crypto &&
      typeof (globalThis as GlobalWithCrypto).crypto?.randomUUID === 'function'
    ) {
      const uuid = (globalThis as GlobalWithCrypto).crypto?.randomUUID?.();
      if (uuid) return uuid;
    }
  } catch (_) {
    // fall through to fallback
  }
  // Fallback: RFC4122 v4-ish using crypto.getRandomValues if available, else Math.random (last resort)
  const getBytes = (): Uint8Array => {
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as GlobalWithCrypto).crypto &&
      typeof (globalThis as GlobalWithCrypto).crypto?.getRandomValues ===
        'function'
    ) {
      const buf = new Uint8Array(16);
      (globalThis as GlobalWithCrypto).crypto?.getRandomValues?.(buf);
      return buf;
    }
    const buf = new Uint8Array(16);
    for (let i = 0; i < 16; i++) buf[i] = (Math.random() * 256) & 0xff; // non-crypto fallback
    return buf;
  };
  const b = getBytes();
  // Per RFC4122 section 4.4
  const b6 = b[6];
  const b8 = b[8];
  if (b6 !== undefined && b8 !== undefined) {
    b[6] = (b6 & 0x0f) | 0x40; // version 4
    b[8] = (b8 & 0x3f) | 0x80; // variant 10xxxxxx
  }
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const hex = Array.from(b).map(toHex).join('');
  return (
    hex.slice(0, 8) +
    '-' +
    hex.slice(8, 12) +
    '-' +
    hex.slice(12, 16) +
    '-' +
    hex.slice(16, 20) +
    '-' +
    hex.slice(20)
  );
}

/**
 * Extract request ID from NextRequest or generate a new one
 */
export function getOrCreateRequestId(_request: NextRequest): string {
  // Always return a canonical, freshly generated request ID.
  // Any inbound x-request-id is treated as an external correlation ID and should not be reused.
  return generateRequestId();
}

/**
 * Extract request ID from headers or generate a new one
 */
export function getOrCreateRequestIdFromHeaders(_headers: Headers): string {
  // Always generate a new canonical ID for responses/logging.
  return generateRequestId();
}

/**
 * Retrieve an external/inbound request ID from headers if present.
 * This is for correlation only and must not be used as the canonical ID.
 */
export function getExternalRequestIdFromHeaders(
  headers: Headers
): string | undefined {
  return headers.get('x-request-id') || headers.get('x-trace-id') || undefined;
}

/**
 * Request context interface
 */
export interface RequestContext {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  /** Inbound correlation id provided by upstream (x-request-id or x-trace-id) */
  externalId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Create request context manually
 */
export function createRequestContext(
  requestId: string,
  method?: string,
  url?: string,
  userAgent?: string,
  ip?: string
): RequestContext {
  return {
    id: requestId,
    timestamp: new Date().toISOString(),
    method: method || 'UNKNOWN',
    url: url || 'unknown',
    userAgent,
    ip,
  };
}

/**
 * Create request context from NextRequest object
 */
export function createRequestContextFromNextRequest(
  request: NextRequest,
  requestId?: string
): RequestContext {
  const id = requestId || getOrCreateRequestId(request);
  const externalId = getExternalRequestIdFromHeaders(request.headers);

  return {
    id,
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    externalId,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined,
  };
}
