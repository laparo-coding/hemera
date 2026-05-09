import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getClerkKeyMismatchReason } from './lib/auth/clerk-key-validation';
import { serverInstance } from './lib/monitoring/rollbar-official';

// In E2E test mode, bypass Clerk middleware entirely
const isE2EMode =
  process.env.E2E_TEST === '1' || process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';
const clerkKeyMismatchReason = getClerkKeyMismatchReason(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  process.env.CLERK_SECRET_KEY
);
let hasLoggedClerkKeyMismatch = false;

// Prepare a Clerk middleware instance for non-E2E mode
const isUserProfileRoute = createRouteMatcher(['/user-profile(.*)']);

const clerkMw = clerkMiddleware(async (auth, request) => {
  if (isUserProfileRoute(request)) {
    await auth.protect();
  }
});

function logClerkKeyMismatch(reason: string, request: NextRequest): void {
  if (hasLoggedClerkKeyMismatch) {
    return;
  }

  hasLoggedClerkKeyMismatch = true;
  serverInstance.error('[auth] Clerk proxy bypass due to key mismatch', {
    pathname: request.nextUrl.pathname,
    reason,
  });
}

// Custom proxy to enforce legacy redirects and then delegate to Clerk (when enabled)
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Legacy redirect: consolidate all /protected/* to /dashboard (before any auth handling)
  if (/^\/protected(\/|$)/.test(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url), 308);
  }

  // Service API routes must always go through auth (even in E2E mode)
  if (/^\/api\/service(\/|$)/.test(pathname)) {
    if (clerkKeyMismatchReason) {
      logClerkKeyMismatch(clerkKeyMismatchReason, request);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'AUTH_CONFIGURATION_ERROR',
            message: 'Authentication service is temporarily unavailable.',
          },
        }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    // Allow CORS preflight (OPTIONS) requests through without auth
    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    // API-Key-basierte M2M-Authentifizierung: wenn ein X-API-Key Header
    // vorhanden ist, Clerk-Middleware überspringen und den Request direkt
    // durchlassen. Die Validierung erfolgt im Route-Handler.
    const hasApiKey = !!request.headers.get('x-api-key');
    if (hasApiKey) {
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

  if (clerkKeyMismatchReason) {
    logClerkKeyMismatch(clerkKeyMismatchReason, request);
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
