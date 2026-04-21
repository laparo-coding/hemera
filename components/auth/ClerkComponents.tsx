'use client';

import {
  Show as ClerkShow,
  UserButton as ClerkUserButton,
} from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

function shouldBypassClerk() {
  return (
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1' ||
    process.env.NEXT_PUBLIC_E2E_TEST === '1'
  );
}

/**
 * Safe wrapper for SignedIn that handles missing ClerkProvider
 * When Clerk is bypassed, this renders nothing (user is treated as signed out)
 */
export function SignedIn({ children }: AuthWrapperProps) {
  const bypassClerk = shouldBypassClerk();

  const [isClerkAvailable, setIsClerkAvailable] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    // Check if ClerkProvider context is available by looking for Clerk on window
    const clerkAvailable =
      typeof window !== 'undefined' &&
      (window as any).__clerk_publishable_key !== undefined;
    setIsClerkAvailable(clerkAvailable);
  }, []);

  // Still loading/checking
  if (isClerkAvailable === null) {
    return null;
  }

  if (bypassClerk) {
    return null;
  }

  // Clerk is bypassed, treat user as signed out
  if (!isClerkAvailable) {
    return null;
  }

  return <ClerkShow when='signed-in'>{children}</ClerkShow>;
}

/**
 * Safe wrapper for SignedOut that handles missing ClerkProvider
 * When Clerk is bypassed, this renders children (user is treated as signed out)
 */
export function SignedOut({ children }: AuthWrapperProps) {
  const bypassClerk = shouldBypassClerk();

  const [isClerkAvailable, setIsClerkAvailable] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    // Check if ClerkProvider context is available
    const clerkAvailable =
      typeof window !== 'undefined' &&
      (window as any).__clerk_publishable_key !== undefined;
    setIsClerkAvailable(clerkAvailable);
  }, []);

  // Still loading/checking - show nothing to prevent flash
  if (isClerkAvailable === null) {
    return null;
  }

  if (bypassClerk) {
    return <>{children}</>;
  }

  // Clerk is bypassed, show signed-out content
  if (!isClerkAvailable) {
    return <>{children}</>;
  }

  return <ClerkShow when='signed-out'>{children}</ClerkShow>;
}

/**
 * Safe wrapper for UserButton that handles missing ClerkProvider
 * When Clerk is bypassed, this renders nothing
 */
export function UserButton(
  props: React.ComponentProps<typeof ClerkUserButton>
) {
  const bypassClerk = shouldBypassClerk();

  const [isClerkAvailable, setIsClerkAvailable] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const clerkAvailable =
      typeof window !== 'undefined' &&
      (window as any).__clerk_publishable_key !== undefined;
    setIsClerkAvailable(clerkAvailable);
  }, []);

  if (isClerkAvailable === null || bypassClerk || !isClerkAvailable) {
    return null;
  }

  return <ClerkUserButton {...props} />;
}
