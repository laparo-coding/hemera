'use client';

import dynamic from 'next/dynamic';
import type * as React from 'react';
import ClerkProviderWrapper from './auth/ClerkProviderWrapper';
import ErrorBoundary from './ErrorBoundary';
import ConditionalPublicNavigation from './navigation/ConditionalPublicNavigation';
import StripeProvider from './payment/StripeProvider';
import ThemeRegistry from './ThemeRegistry';
import { RollbarProviderWrapper } from '../lib/monitoring/rollbar-react-official';

// Defer MonitoringInit to load after initial render (FR-002, NFR-001)
// Feature: 012-performance-improvement
const MonitoringInit = dynamic(() => import('./MonitoringInit'), {
  ssr: false,
});

type ProvidersProps = {
  children: React.ReactNode;
  isE2E: boolean;
};

export default function Providers({ children, isE2E }: ProvidersProps) {
  return (
    <ClerkProviderWrapper>
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
