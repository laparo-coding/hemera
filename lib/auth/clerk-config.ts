/**
 * Clerk Authentication Configuration
 *
 * Centralized configuration for Clerk authentication including:
 * - Social providers setup
 * - Appearance customization
 * - Navigation URLs
 * - Security settings
 */

import { env } from '@/lib/env';

/**
 * Clerk appearance configuration for consistent theming
 */
export const clerkAppearance = {
  elements: {
    rootBox: {
      width: '100%',
    },
    card: {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: 'transparent',
    },
    // Social login buttons styling
    socialButtonsBlockButton: {
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      marginBottom: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderColor: 'rgba(0, 0, 0, 0.23)',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    socialButtonsBlockButtonText: {
      fontSize: '14px',
      fontWeight: 500,
      color: 'rgba(0, 0, 0, 0.87)',
    },
    // Divider styling
    dividerLine: {
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      height: '1px',
      margin: '16px 0',
    },
    dividerText: {
      color: 'rgba(0, 0, 0, 0.6)',
      fontSize: '14px',
      fontWeight: 400,
    },
    // Form elements
    formButtonPrimary: {
      backgroundColor: '#1976d2',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      padding: '12px 24px',
      border: 'none',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: '#1565c0',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    formFieldInput: {
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.23)',
      fontSize: '14px',
      padding: '12px 16px',
      transition: 'all 0.2s ease-in-out',
      '&:focus': {
        borderColor: '#1976d2',
        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
        outline: 'none',
      },
      '&:hover': {
        borderColor: 'rgba(0, 0, 0, 0.87)',
      },
    },
    formFieldLabel: {
      fontSize: '14px',
      fontWeight: 500,
      color: 'rgba(0, 0, 0, 0.87)',
      marginBottom: '4px',
    },
    // Header elements
    headerTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: 'rgba(0, 0, 0, 0.87)',
      marginBottom: '8px',
    },
    headerSubtitle: {
      fontSize: '14px',
      color: 'rgba(0, 0, 0, 0.6)',
      marginBottom: '24px',
    },
    // Footer elements
    footerActionLink: {
      color: '#1976d2',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 500,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  },
  variables: {
    colorPrimary: '#1976d2',
    colorSuccess: '#2e7d32',
    colorWarning: '#ed6c02',
    colorDanger: '#d32f2f',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontFamilyButtons: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '14px',
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    borderRadius: '8px',
    spacingUnit: '1rem',
  },
};

/**
 * Available social providers configuration
 */
export const socialProviders = [
  'google',
  'github',
  'microsoft',
  'apple',
] as const;

export type SocialProvider = (typeof socialProviders)[number];

/**
 * Social provider display configuration
 */
export const socialProviderConfig = {
  google: {
    name: 'Google',
    icon: '🔍', // In production, use proper icons
    bgColor: '#ffffff',
    textColor: '#000000',
    hoverColor: '#f5f5f5',
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    bgColor: '#24292e',
    textColor: '#ffffff',
    hoverColor: '#2f363d',
  },
  microsoft: {
    name: 'Microsoft',
    icon: '🏢',
    bgColor: '#0078d4',
    textColor: '#ffffff',
    hoverColor: '#106ebe',
  },
  apple: {
    name: 'Apple',
    icon: '🍎',
    bgColor: '#000000',
    textColor: '#ffffff',
    hoverColor: '#1d1d1f',
  },
};

/**
 * Clerk navigation configuration
 */
export const clerkConfig = {
  signInUrl: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
  // New Clerk redirect props
  signInFallbackRedirectUrl:
    env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  signUpFallbackRedirectUrl:
    env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  // Optional force redirects (leave empty to disable)
  signInForceRedirectUrl: undefined as string | undefined,
  signUpForceRedirectUrl: undefined as string | undefined,
  // Backward-compat convenience (deprecated): map to new names
  // TODO: remove when all usages are migrated
  get afterSignInUrl() {
    return this.signInFallbackRedirectUrl;
  },
  get afterSignUpUrl() {
    return this.signUpFallbackRedirectUrl;
  },
  dashboardUrl: '/dashboard',
  profileUrl: '/my-courses', // Use existing route instead of /protected/profile
};

/**
 * Security and UX configuration
 */
export const authConfig = {
  // Session duration (in milliseconds)
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Social login preferences
  socialLoginEnabled: true,
  prioritySocialProviders: ['google', 'github'] as SocialProvider[],

  // Security features
  twoFactorEnabled: false, // Can be enabled in Clerk dashboard
  emailVerificationRequired: true,
  phoneVerificationRequired: false,

  // UX preferences
  allowSignUpWithoutInvitation: true,
  showSocialProvidersFirst: true,
  rememberMeEnabled: true,
};

/**
 * Error messages for better UX
 */
export const authErrorMessages = {
  invalidCredentials: 'Invalid email or password. Please try again.',
  emailNotVerified: 'Please verify your email address before signing in.',
  accountLocked:
    'Your account has been temporarily locked. Please try again later.',
  socialLoginError: 'Unable to sign in with social provider. Please try again.',
  networkError: 'Network error. Please check your connection and try again.',
  unknownError: 'An unexpected error occurred. Please try again.',
};

/**
 * Helper function to get social provider configuration
 */
export function getSocialProviderConfig(provider: SocialProvider) {
  return socialProviderConfig[provider];
}

/**
 * Helper function to check if social login is enabled
 */
export function isSocialLoginEnabled(): boolean {
  return authConfig.socialLoginEnabled;
}

/**
 * Helper function to get enabled social providers
 */
export function getEnabledSocialProviders(): SocialProvider[] {
  return authConfig.prioritySocialProviders;
}
