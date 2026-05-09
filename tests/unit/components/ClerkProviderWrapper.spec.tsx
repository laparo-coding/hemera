/** @jest-environment jsdom */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='clerk-provider'>{children}</div>
  ),
}));

jest.mock('../../../lib/auth/clerk-config', () => ({
  clerkConfig: {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
    signInFallbackRedirectUrl: '/dashboard',
    signUpFallbackRedirectUrl: '/dashboard',
    signInForceRedirectUrl: undefined,
    signUpForceRedirectUrl: undefined,
  },
}));

const logClientError = jest.fn();
const logClientWarning = jest.fn();

jest.mock('../../../lib/errors/client', () => ({
  logClientError: (...args: unknown[]) => logClientError(...args),
  logClientWarning: (...args: unknown[]) => logClientWarning(...args),
}));

import ClerkProviderWrapper from '../../../components/auth/ClerkProviderWrapper';

describe('ClerkProviderWrapper', () => {
  const originalPublishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
      'pk_test_example123456';
    process.env.NEXT_PUBLIC_DISABLE_CLERK = '0';
    process.env.NEXT_PUBLIC_E2E_TEST = '0';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
  });

  it('falls back to children when Clerk reports the key mismatch redirect loop', async () => {
    render(
      <ClerkProviderWrapper>
        <div data-testid='app-shell'>App Shell</div>
      </ClerkProviderWrapper>
    );

    expect(screen.getByTestId('clerk-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          message:
            'Refreshing the session token resulted in an infinite redirect loop. This usually means that your Clerk instance keys do not match.',
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('clerk-provider')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(logClientWarning).toHaveBeenCalledWith(
      '[ClerkProviderWrapper] Clerk runtime error detected, disabling provider',
      expect.objectContaining({
        reason: expect.stringContaining('infinite redirect loop'),
      })
    );
  });
});