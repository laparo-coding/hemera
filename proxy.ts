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

  // Service API routes must always go through Clerk auth (even in E2E mode)
  if (/^\/api\/service(\/|$)/.test(pathname)) {
    // Fail fast if request has no auth header and no cookies at all
    const hasAuthHeader = !!request.headers.get('authorization');
    const hasCookie = !!request.headers.get('cookie');
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
