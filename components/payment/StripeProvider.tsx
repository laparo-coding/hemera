'use client';

import { loadStripe } from '@stripe/stripe-js';
import type { ReactNode } from 'react';

// Expose the Stripe promise and shared appearance config so pages can
// instantiate <Elements> with the correct clientSecret when it becomes available.
export const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const isE2EMode = process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

// Safely load Stripe only if publishable key is configured
// Note: Do NOT silently swallow errors — Safari ITP can block Stripe.js,
// and downstream components need to detect the failure (via timeout/null check).
export const stripePromise =
  !isE2EMode && publishableKey && publishableKey.length > 0
    ? loadStripe(publishableKey).catch(err => {
        // biome-ignore lint/suspicious/noConsole: Critical payment error logging
        console.error('[Stripe] Laden fehlgeschlagen:', err);
        return null;
      })
    : null;

export const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#1976d2',
    colorBackground: '#ffffff',
    colorText: '#424242',
    colorDanger: '#df1b41',
    fontFamily: 'Inter, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
};

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  // No-op provider retained for API compatibility; individual pages should
  // mount their own <Elements> instances once they have a clientSecret.
  return <>{children}</>;
}
