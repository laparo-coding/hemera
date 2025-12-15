'use client';

import { deDE } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { clerkConfig } from '../../lib/auth/clerk-config';

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export default function ClerkProviderWrapper({
  children,
}: ClerkProviderWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isE2E =
    process.env.E2E_TEST === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  // Simple heuristic for Clerk key format; real validation happens inside Clerk, but we want
  // to avoid throwing during static prerender if something is clearly off.
  const looksLikeClerkKey = (key?: string) =>
    !!key && /^pk_(test|live)_[A-Za-z0-9_-]{10,}$/.test(key);

  // In CI/Vercel preview builds we prefer to bypass Clerk rather than fail the build
  const isVercelPreview =
    process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';

  // Detect Vercel deployment URLs that may not be in Clerk's allowed domains
  // Production Clerk keys only work on domains configured in Clerk Dashboard
  const isVercelDeploymentUrl =
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('.vercel.app') ||
      window.location.hostname.includes('-git-'));

  // In E2E tests or when explicitly disabled, bypass Clerk to not block rendering
  if (isE2E) return <>{children}</>;

  // If running a Vercel preview build and the key is missing/likely invalid, bypass Clerk to prevent
  // prerender errors during build. In development we still show an explicit error to surface misconfiguration.
  if (isVercelPreview && !looksLikeClerkKey(publishableKey)) {
    console.warn(
      '[ClerkProviderWrapper] Clerk bypassed in Vercel preview due to missing/invalid key'
    );
    return <>{children}</>;
  }

  // Bypass Clerk on Vercel deployment URLs with production keys to avoid origin mismatch errors
  // Production Clerk keys are restricted to specific domains (e.g., hemera.academy)
  if (
    isVercelDeploymentUrl &&
    publishableKey?.startsWith('pk_live_') &&
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('hemera.academy')
  ) {
    console.warn(
      '[ClerkProviderWrapper] Clerk bypassed: Production key cannot be used on Vercel deployment URL'
    );
    return <>{children}</>;
  }

  if (!publishableKey) {
    // In non-development or when key is missing, bypass Clerk to not block render
    console.warn(
      '[ClerkProviderWrapper] Clerk bypassed: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured'
    );
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={deDE}
      signInUrl={clerkConfig.signInUrl}
      signUpUrl={clerkConfig.signUpUrl}
      signInFallbackRedirectUrl={clerkConfig.signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={clerkConfig.signUpFallbackRedirectUrl}
      signInForceRedirectUrl={clerkConfig.signInForceRedirectUrl}
      signUpForceRedirectUrl={clerkConfig.signUpForceRedirectUrl}
    >
      {children}
    </ClerkProvider>
  );
}
