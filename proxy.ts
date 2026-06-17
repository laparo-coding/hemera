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

// Prepare a Clerk middleware instance for non-E2E mode
const isUserProfileRoute = createRouteMatcher(['/user-profile(.*)']);

const clerkMw = clerkMiddleware(async (auth, request) => {
  if (isUserProfileRoute(request)) {
    await auth.protect();
  }
});

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1]?.trim();
  return token ? token : null;
}

function logClerkKeyMismatch(reason: string, request: NextRequest): void {
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
            message:
              'Der Authentifizierungsdienst steht vorubergehend nicht zur ' +
              'Verfugung. Bitte versuche es spater erneut.',
          },
        }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    // Allow CORS preflight (OPTIONS) requests through without auth
    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    // Fail fast if request has no usable auth material at all.
    // Requests mit X-API-Key werden weiterhin durch die Clerk-Middleware
    // geleitet, damit der normale API-Route-Resolver auf allen Umgebungen
    // konsistent greift. Die eigentliche API-Key-Validierung erfolgt erst
    // im Route-Handler.
    const hasApiKey = !!request.headers.get('x-api-key');
    const authorizationHeader = request.headers.get('authorization');
    const bearerToken = extractBearerToken(authorizationHeader);
    const hasAuthHeader = !!bearerToken;
    const cookieValue = request.headers.get('cookie');
    const hasCookie = !!cookieValue && cookieValue.trim().length > 0;
    if (!hasApiKey && !hasAuthHeader && !hasCookie) {
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
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_CONFIGURATION_ERROR',
          message:
            'Der Authentifizierungsdienst steht vorubergehend nicht zur ' +
            'Verfugung. Bitte versuche es spater erneut.',
        },
      },
      { status: 503 }
    );
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
