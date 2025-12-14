'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly wrapper to prevent hydration mismatches.
 *
 * Use this for components that:
 * - Depend on browser APIs (window, localStorage)
 * - Have different server/client rendering (auth state, Clerk SignedIn/SignedOut)
 * - Use Date/time formatting that differs by locale
 *
 * The component renders nothing (or fallback) on the server and during
 * initial hydration, then renders children after the client has mounted.
 */
export default function ClientOnly({
  children,
  fallback = null,
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
