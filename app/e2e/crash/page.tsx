// This page intentionally crashes to test the error boundary during E2E.
// It is only accessible when E2E_TEST is true; otherwise it returns 404.

import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CrashPage() {
  // Only allow access during E2E tests
  if (process.env.E2E_TEST !== 'true') {
    notFound();
  }

  // Intentionally throw to trigger the segment error boundary (app/error.tsx)
  throw new Error('E2E intentional crash');
}
