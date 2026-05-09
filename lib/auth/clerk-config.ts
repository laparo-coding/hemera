/**
 * Clerk Authentication Configuration
 *
 * Centralized configuration for Clerk authentication including:
 * - Social providers setup
 * - Appearance customization
 * - Navigation URLs
 * - Security settings
 */

import { env } from '../env';

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
  profileUrl: '/user-profile', // Use dedicated localized profile route
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
