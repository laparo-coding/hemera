'use client';

import { usePathname } from 'next/navigation';
import { PublicNavigation } from './PublicNavigation';

// Route prefixes that represent protected areas
const PROTECTED_PREFIXES = ['/dashboard', '/my-courses', '/admin', '/bookings'];

export default function ConditionalPublicNavigation() {
  const pathname = usePathname() || '/';
  const isE2E =
    process.env.E2E_TEST === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // In E2E mode: do not render public navigation on protected pages
  // to avoid duplicate [data-testid] selectors
  if (isE2E) {
    if (isProtected) return null;
    return <PublicNavigation />;
  }

  // Show header also on dashboard, but hide the "Meine Kurse" button
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return <PublicNavigation />;
  }

  if (isProtected) return null;

  return <PublicNavigation />;
}
