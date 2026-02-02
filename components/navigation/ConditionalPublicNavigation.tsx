'use client';

import { usePathname } from 'next/navigation';
import { PublicNavigation } from './PublicNavigation';

// Route prefixes that represent protected areas (excluding dashboard which gets special handling)
const PROTECTED_PREFIXES = ['/my-courses', '/admin', '/bookings'];

export default function ConditionalPublicNavigation() {
  const pathname = usePathname() || '/';
  const isE2E =
    process.env.E2E_TEST === '1' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  const isDashboard =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Dashboard always shows navigation (with UserButton when logged in)
  if (isDashboard) {
    return <PublicNavigation hideMyCourses />;
  }

  // In E2E mode: do not render public navigation on other protected pages
  if (isE2E && isProtected) {
    return null;
  }

  if (isProtected) return null;

  return <PublicNavigation />;
}
