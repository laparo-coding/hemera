'use client';

import { deDE } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { clerkConfig } from '../../lib/auth/clerk-config';
import { logClientError, logClientWarning } from '../../lib/errors/client';

const CLERK_RUNTIME_BYPASS_MESSAGES = [
  'Refreshing the session token resulted in an infinite redirect loop',
  'Clerk instance keys do not match',
] as const;

// Custom German localization with overrides
const customDeDE = {
  ...deDE,
  formFieldInputPlaceholder__signUpPassword: 'Passwort erstellen',
  signIn: {
    ...deDE.signIn,
    start: {
      ...deDE.signIn?.start,
      title: 'Bei Hemera anmelden',
      actionText: 'Kein Account?',
      actionLink: 'Registrieren',
    },
  },
  signUp: {
    ...deDE.signUp,
    start: {
      ...deDE.signUp?.start,
      title: 'Bei Hemera registrieren',
      actionText: 'Bereits registriert?',
      actionLink: 'Anmelden',
    },
  },
};

interface ClerkProviderWrapperProps {
  children: ReactNode;
  forcedBypassReason?: string | null;
}

interface ClerkErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ClerkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary to catch Clerk initialization errors and provide graceful fallback
 */
class ClerkErrorBoundary extends Component<
  ClerkErrorBoundaryProps,
  ClerkErrorBoundaryState
> {
  constructor(props: ClerkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ClerkErrorBoundaryState {
    // Check if this is a Clerk-related error
    const isClerkError =
      error.message?.includes('Clerk') ||
      error.message?.includes('origin_invalid') ||
      error.message?.includes('Production Keys') ||
      error.message?.includes('pk_live_') ||
      error.message?.includes('pk_test_');

    if (isClerkError) {
      logClientWarning(
        '[ClerkErrorBoundary] Caught Clerk error, using fallback',
        { error: error.message }
      );
      return { hasError: true, error };
    }

    // Re-throw non-Clerk errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logClientError(error, {
      component: 'ClerkErrorBoundary',
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Render children without Clerk (unauthenticated mode)
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Determines if the current environment should bypass Clerk
 */
function shouldBypassClerk(publishableKey?: string): {
  bypass: boolean;
  reason?: string;
} {
  const isE2E =
    process.env.NEXT_PUBLIC_E2E_TEST === '1' ||
    process.env.NEXT_PUBLIC_DISABLE_CLERK === '1';

  if (isE2E) {
    return { bypass: true, reason: 'E2E test mode' };
  }

  // Simple heuristic for Clerk key format
  const looksLikeClerkKey = (key?: string) =>
    !!key && /^pk_(test|live)_[A-Za-z0-9_-]{10,}$/.test(key);

  const isVercelPreview =
    process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'preview';

  if (isVercelPreview && !looksLikeClerkKey(publishableKey)) {
    return { bypass: true, reason: 'Vercel preview with invalid key' };
  }

  if (!publishableKey) {
    return { bypass: true, reason: 'Missing publishable key' };
  }

  // Client-side checks
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Detect Vercel deployment URLs
    const isVercelDeploymentUrl =
      hostname.endsWith('.vercel.app') || hostname.includes('-git-');

    // Production keys only work on configured domains
    const isProductionKey = publishableKey.startsWith('pk_live_');
    const isProductionDomain =
      hostname.includes('hemera.academy') || hostname === 'localhost';

    if (isVercelDeploymentUrl && isProductionKey && !isProductionDomain) {
      return {
        bypass: true,
        reason: 'Production key on Vercel deployment URL',
      };
    }
  }

  return { bypass: false };
}

function extractRuntimeErrorMessage(value: unknown): string | null {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message;
  }

  return null;
}

function shouldBypassForRuntimeError(value: unknown): string | null {
  const message = extractRuntimeErrorMessage(value);

  if (!message) {
    return null;
  }

  return CLERK_RUNTIME_BYPASS_MESSAGES.some(fragment =>
    message.includes(fragment)
  )
    ? message
    : null;
}

export default function ClerkProviderWrapper({
  children,
  forcedBypassReason = null,
}: ClerkProviderWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const { bypass, reason } = shouldBypassClerk(publishableKey);
  const [runtimeBypassReason, setRuntimeBypassReason] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (bypass) {
      return;
    }

    const handleRuntimeBypass = (errorLike: unknown) => {
      const message = shouldBypassForRuntimeError(errorLike);

      if (!message) {
        return;
      }

      setRuntimeBypassReason(currentReason => {
        if (currentReason === message) {
          return currentReason;
        }

        logClientWarning(
          '[ClerkProviderWrapper] Clerk runtime error detected, disabling provider',
          { reason: message }
        );

        return message;
      });
    };

    const onError = (event: ErrorEvent) => {
      handleRuntimeBypass(event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleRuntimeBypass(event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [bypass]);

  if (forcedBypassReason || bypass || runtimeBypassReason) {
    const bypassReason = forcedBypassReason ?? runtimeBypassReason ?? reason;

    if (bypassReason) {
      // Only log in development - this is expected behavior in test mode
      if (
        process.env.NODE_ENV === 'development' &&
        bypassReason !== 'E2E test mode'
      ) {
        logClientWarning('[ClerkProviderWrapper] Clerk bypassed', {
          reason: bypassReason,
        });
      }
    }
    return <>{children}</>;
  }

  return (
    <ClerkErrorBoundary fallback={children}>
      <ClerkProvider
        publishableKey={publishableKey!}
        localization={customDeDE}
        signInUrl={clerkConfig.signInUrl}
        signUpUrl={clerkConfig.signUpUrl}
        signInFallbackRedirectUrl={clerkConfig.signInFallbackRedirectUrl}
        signUpFallbackRedirectUrl={clerkConfig.signUpFallbackRedirectUrl}
        signInForceRedirectUrl={clerkConfig.signInForceRedirectUrl}
        signUpForceRedirectUrl={clerkConfig.signUpForceRedirectUrl}
      >
        {children}
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}
