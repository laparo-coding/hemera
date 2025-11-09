'use client';

import { loadStripe } from '@stripe/stripe-js';
import type { ReactNode } from 'react';

// Expose the Stripe promise and shared appearance config so pages can
// instantiate <Elements> with the correct clientSecret when it becomes available.
export const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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
