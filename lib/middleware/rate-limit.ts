/**
 * Rate limiting middleware for service API endpoints
 * In-memory implementation for MVP (can be upgraded to Redis later)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UserRole } from '../auth/permissions';
import Redis from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

interface RateLimitState {
  count: number;
  resetAt: number; // Unix timestamp in milliseconds
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitState>();

// transient store to hold last Upstash response for header generation
const lastRateLimitStates = new Map<string, { limit: number; remaining: number; resetAtSeconds: number }>();

// Rate limit configuration per role
const RATE_LIMITS: Record<UserRole, { windowMs: number; maxRequests: number }> = {
  'api-client': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500,
  },
  moderator: {
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
  user: {
    windowMs: 60 * 1000,
    maxRequests: 50,
  },
};

/**
 * Check rate limit for a user
 * Returns null if within limit, or Response object if limit exceeded
 */
export async function checkRateLimit(
  userId: string,
  role: UserRole,
  requestId: string
): Promise<NextResponse | null> {
  const now = Date.now();
  const key = `${role}:${userId}`;
  const config = RATE_LIMITS[role];

  // If Upstash env is configured, use distributed limiter
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = Redis.fromEnv();
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.maxRequests, `${Math.ceil(config.windowMs / 1000)} s`),
      });

      const res = await limiter.limit(key);
      // store transient info for headers
      lastRateLimitStates.set(key, {
        limit: res.limit,
        remaining: res.remaining ?? 0,
        resetAtSeconds: Math.ceil((Date.now() + (res.reset ?? 0)) / 1000),
      });

      if (!res.success) {
        const retryAfter = res.reset ?? Math.ceil(config.windowMs / 1000);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
            },
            meta: {
              requestId,
              timestamp: new Date().toISOString(),
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(res.limit),
              'X-RateLimit-Remaining': String(res.remaining ?? 0),
              'X-RateLimit-Reset': String(Math.ceil((Date.now() + (res.reset ?? 0)) / 1000)),
              'Retry-After': String(res.reset ?? Math.ceil(config.windowMs / 1000)),
              'X-Request-ID': requestId,
            },
          }
        );
      }

      return null;
    } catch (err) {
      // On errors, fall back to in-memory (do not block requests)
      // eslint-disable-next-line no-console
      console.error('Upstash rate limit error, falling back to memory limiter', err);
    }
  }

  // In-memory fallback (existing behavior)
  let state = rateLimitStore.get(key);

  // Reset if window has passed
  if (!state || now >= state.resetAt) {
    state = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, state);
  }

  // Increment request count
  state.count++;

  // Calculate remaining requests
  const remaining = Math.max(0, config.maxRequests - state.count);
  const resetTimestampSeconds = Math.ceil(state.resetAt / 1000); // Unix timestamp (seconds UTC)
  const retryAfterSeconds = Math.max(0, Math.ceil((state.resetAt - now) / 1000));

  // store transient state
  lastRateLimitStates.set(key, {
    limit: config.maxRequests,
    remaining,
    resetAtSeconds: resetTimestampSeconds,
  });

  // Check if limit exceeded
  if (state.count > config.maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetTimestampSeconds),
          'Retry-After': String(retryAfterSeconds),
          'X-Request-ID': requestId,
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit headers for successful responses
 */
export async function getRateLimitHeaders(
  userId: string,
  role: UserRole
): Promise<Record<string, string>> {
  const now = Date.now();
  const key = `${role}:${userId}`;
  const config = RATE_LIMITS[role];

  // If we have an Upstash transient state saved from checkRateLimit, use it
  const transient = lastRateLimitStates.get(key);
  if (transient) {
    return {
      'X-RateLimit-Limit': String(transient.limit),
      'X-RateLimit-Remaining': String(transient.remaining),
      'X-RateLimit-Reset': String(transient.resetAtSeconds),
    };
  }

  // Fallback to in-memory store
  const state = rateLimitStore.get(key);
  if (!state) {
    const resetAt = Math.ceil((now + config.windowMs) / 1000);
    return {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(config.maxRequests),
      'X-RateLimit-Reset': String(resetAt),
    };
  }

  const remainingNow = Math.max(0, config.maxRequests - state.count);
  const resetAtSeconds = Math.ceil(state.resetAt / 1000);

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remainingNow),
    'X-RateLimit-Reset': String(resetAtSeconds),
  };
}

/**
 * Cleanup expired rate limit entries (call periodically)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, state] of rateLimitStore.entries()) {
    if (now >= state.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}
