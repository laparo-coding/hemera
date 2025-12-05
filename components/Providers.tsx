'use client';

import dynamic from 'next/dynamic';
import type * as React from 'react';
import ClerkProviderWrapper from '@/components/auth/ClerkProviderWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';
import ConditionalPublicNavigation from '@/components/navigation/ConditionalPublicNavigation';
import StripeProvider from '@/components/payment/StripeProvider';
import ThemeRegistry from '@/components/ThemeRegistry';
import { RollbarProviderWrapper } from '@/lib/monitoring/rollbar-react-official';

// Defer MonitoringInit to load after initial render (FR-002, NFR-001)
// Feature: 012-performance-improvement
const MonitoringInit = dynamic(() => import('@/components/MonitoringInit'), {
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
