'use client';

import dynamic from 'next/dynamic';
import type * as React from 'react';
import { RollbarProviderWrapper } from '../lib/monitoring/rollbar-react-official';
import ClerkProviderWrapper from './auth/ClerkProviderWrapper';
import ErrorBoundary from './ErrorBoundary';
import ConditionalPublicNavigation from './navigation/ConditionalPublicNavigation';
import StripeProvider from './payment/StripeProvider';
import ThemeRegistry from './ThemeRegistry';

// Defer MonitoringInit to load after initial render (FR-002, NFR-001)
// Feature: 012-performance-improvement
const MonitoringInit = dynamic(() => import('./MonitoringInit'), {
  ssr: false,
});

type ProvidersProps = {
  children: React.ReactNode;
  isE2E: boolean;
  clerkBypassReason: string | null;
};

export default function Providers({
  children,
  isE2E,
  clerkBypassReason,
}: ProvidersProps) {
  return (
    <ClerkProviderWrapper forcedBypassReason={clerkBypassReason}>
      {isE2E ? (
        // In E2E mode: skip Rollbar/Stripe to reduce overhead and flakiness
        <ThemeRegistry>
          <ErrorBoundary>
            <ConditionalPublicNavigation />
            {children}
            <MonitoringInit />
          </ErrorBoundary>
        </ThemeRegistry>
      ) : (
        <RollbarProviderWrapper>
          <ThemeRegistry>
            <StripeProvider>
              <ErrorBoundary>
                <ConditionalPublicNavigation />
                {children}
                <MonitoringInit />
              </ErrorBoundary>
            </StripeProvider>
          </ThemeRegistry>
        </RollbarProviderWrapper>
      )}
    </ClerkProviderWrapper>
  );
}
