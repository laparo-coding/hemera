import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFetchEvent } from 'next/server';
import { NextRequest } from 'next/server';

const mockClerkHandler = jest.fn();
const mockServerError = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn(() => mockClerkHandler),
  createRouteMatcher: jest.fn(() => () => false),
}));

jest.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    error: (...args: unknown[]) => mockServerError(...args),
  },
}));

describe('proxy', () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.E2E_TEST = '0';
    process.env.NEXT_PUBLIC_DISABLE_CLERK = '0';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    process.env.CLERK_SECRET_KEY = originalSecretKey;
  });

  it('returns a configuration error for service APIs when Clerk keys mismatch', async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_public123';
    process.env.CLERK_SECRET_KEY = 'sk_live_secret456';

    const { default: proxy } = await import('@/proxy');
    const mockNextFetchEvent = {
      waitUntil: jest.fn(),
    } as unknown as NextFetchEvent;
    const response = proxy(
      new NextRequest('http://localhost:3000/api/service/courses'),
      mockNextFetchEvent
    );
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      success: false,
      error: {
        code: 'AUTH_CONFIGURATION_ERROR',
        message:
          'Der Authentifizierungsdienst steht vorubergehend nicht zur ' +
          'Verfugung. Bitte versuche es spater erneut.',
      },
    });
    expect(mockServerError).toHaveBeenCalledWith(
      '[auth] Clerk proxy bypass due to key mismatch',
      expect.objectContaining({
        pathname: '/api/service/courses',
        reason: expect.stringContaining('passen nicht zusammen'),
      })
    );
    expect(mockClerkHandler).not.toHaveBeenCalled();
  });
});