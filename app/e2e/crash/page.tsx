// This page intentionally crashes to test the error boundary during E2E.
// It is only accessible when E2E_TEST is true; otherwise it returns 404.

import { notFound } from 'next/navigation';
import { isEnvFlagEnabled } from '@/lib/utils/env-flags';

export const dynamic = 'force-dynamic';

export default function CrashPage() {
  // Only allow access during E2E tests
  if (!isEnvFlagEnabled(process.env.E2E_TEST)) {
    notFound();
  }

  // Intentionally throw to trigger the segment error boundary (app/error.tsx)
  throw new Error('E2E intentional crash');
}
