import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// In E2E test mode, bypass Clerk middleware entirely
const isE2EMode =
  process.env.E2E_TEST === '1' || process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

// Prepare a Clerk middleware instance for non-E2E mode
const clerkMw = clerkMiddleware();

// Custom proxy to enforce legacy redirects and then delegate to Clerk (when enabled)
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Legacy redirect: consolidate all /protected/* to /dashboard (before any auth handling)
  if (/^\/protected(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url), 308);
  }

  // Service-API-Routen: Duale Authentifizierung
  // 1. API-Key (X-API-Key Header) → überspringt Clerk-Middleware, detaillierte
  //    Validierung im Route-Handler (lib/auth/service-auth.ts)
  // 2. Clerk Session JWT → wird über clerkMw() geprüft
  // Beide Pfade gelten auch im E2E-/Dev-Modus.
  if (/^\/api\/service(\/|$)/.test(pathname)) {
    // Allow CORS preflight (OPTIONS) requests through without auth
    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    // API-Key-basierte M2M-Authentifizierung: wenn ein X-API-Key Header
    // vorhanden ist und ein gültiges Format hat, Clerk-Middleware überspringen.
    // Die vollständige kryptografische Validierung erfolgt im Route-Handler.
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      // Basisvalidierung: Key muss mindestens 32 Zeichen lang sein und
      // darf nur druckbare ASCII-Zeichen enthalten (keine Steuerzeichen/Whitespace).
      // Die vollständige kryptografische Validierung erfolgt im Route-Handler.
      if (apiKey.length < 32 || !/^[\x21-\x7e]+$/.test(apiKey)) {
        // biome-ignore lint/suspicious/noConsole: security log for invalid API key attempts
        console.warn(
          `[proxy] Rejected API key with invalid format (length: ${apiKey.length}) for ${pathname}`
        );
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid API key format',
            },
          }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
      return NextResponse.next();
    }

    // Fail fast if request has no auth header and no cookies at all
    const hasAuthHeader = !!request.headers.get('authorization');
    const cookieValue = request.headers.get('cookie');
    const hasCookie = !!cookieValue && cookieValue.trim().length > 0;
    if (!hasAuthHeader && !hasCookie) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing authentication token',
          },
        }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    // Delegate to Clerk middleware for auth handling
    return clerkMw(request, event);
  }

  // In E2E mode bypass Clerk to reduce flakiness for non-service routes
  if (isE2EMode) {
    return NextResponse.next();
  }

  // Delegate to Clerk middleware for auth handling for all other matched routes
  return clerkMw(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
