import type { SignUpProps, UserButtonProps } from '@clerk/shared/types';
import { authForm, buttonStyles, colors } from '@/lib/design-tokens';

export const authPageClerkAppearance: NonNullable<SignUpProps['appearance']> = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: colors.marsala,
    colorTextOnPrimaryBackground: colors.beige,
    colorBackground: authForm.cardBackground,
    colorText: authForm.textColor,
    colorTextSecondary: authForm.subtleTextColor,
    colorInputBackground: authForm.cardBackground,
    colorInputText: authForm.textColor,
    borderRadius: authForm.inputBorderRadius,
  },
  elements: {
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    cardBox: {
      width: '100%',
      maxWidth: `${authForm.cardMaxWidth}px`,
      padding: '0 16px',
    },
    card: {
      boxShadow: authForm.cardShadow,
      border: `1px solid ${authForm.inputBorderColor}`,
      borderRadius: '12px',
      padding: '32px 28px',
    },
    footer: {
      backgroundColor: authForm.cardBackground,
      color: authForm.textColor,
      borderTop: `1px solid ${authForm.footerBorderColor}`,
      marginTop: '24px',
      paddingTop: '24px',
      '& p': {
        color: authForm.subtleTextColor,
      },
      '& a': {
        color: authForm.textColor,
      },
    },
    footerActionText: {
      color: authForm.subtleTextColor,
      fontSize: '0.95rem',
    },
    identityPreviewText: {
      color: authForm.textColor,
    },
    identityPreviewEditButton: {
      color: authForm.textColor,
      fontWeight: 600,
      '&:hover': {
        color: colors.bronze,
      },
    },
    headerTitle: {
      fontFamily: '"Playfair Display", serif',
      color: authForm.textColor,
      fontSize: '1.75rem',
      fontWeight: 700,
      marginBottom: '8px',
    },
    headerSubtitle: {
      display: 'none',
    },
    formButtonPrimary: {
      backgroundColor: buttonStyles.bronzeFilled.backgroundColor,
      color: buttonStyles.bronzeFilled.textColor,
      fontWeight: 600,
      fontSize: '1rem',
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      padding: '12px 24px',
      minHeight: '48px',
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: buttonStyles.bronzeFilled.hoverBackgroundColor,
      },
      '&:disabled': {
        backgroundColor: buttonStyles.bronzeFilled.disabledBackgroundColor,
        color: buttonStyles.bronzeFilled.disabledTextColor,
        opacity: 0.6,
      },
    },
    formFieldInput: {
      borderRadius: authForm.inputBorderRadius,
      fontSize: '1rem',
      fontFamily: '"Inter", sans-serif',
      minHeight: '48px',
      padding: '12px 16px',
      // Clerk injects highly specific input selectors across multiple wrappers.
      // Keep forced overrides until cross-browser checks prove a narrower rule.
      border: `1px solid ${authForm.inputBorderColor} !important`,
      backgroundColor: authForm.cardBackground,
      color: authForm.textColor,
      WebkitTextFillColor: authForm.textColor,
      caretColor: authForm.textColor,
      WebkitAppearance: 'none',
      appearance: 'none',
      boxShadow: `0 0 0 1px ${authForm.inputBorderColor} !important`,
      WebkitBoxShadow: `0 0 0 1px ${authForm.inputBorderColor} !important`,
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      '&::placeholder': {
        color: authForm.subtleTextColor,
        WebkitTextFillColor: authForm.subtleTextColor,
        opacity: 1,
      },
      // Keep both selectors because Clerk mounts different input wrappers across
      // auth views and both focus states need the same override.
      '&:is(:focus, :focus-within)': {
        border: `1px solid ${authForm.inputBorderColorFocus} !important`,
        boxShadow: `0 0 0 2px rgba(136, 65, 67, 0.1) !important`,
        WebkitBoxShadow: `0 0 0 2px rgba(136, 65, 67, 0.1) !important`,
      },
    },
    formFieldLabel: {
      color: authForm.textColor,
      fontWeight: 600,
      fontSize: '0.95rem',
      fontFamily: '"Inter", sans-serif',
    },
    formFieldInputShowPasswordButton: {
      color: authForm.textColor,
    },
    footerActionLink: {
      color: authForm.textColor,
      fontWeight: 600,
      '&:hover': {
        color: colors.bronze,
      },
    },
    socialButtonsBlockButton: {
      borderColor: authForm.inputBorderColor,
      backgroundColor: authForm.socialButtonBackground,
      color: authForm.textColor,
      justifyContent: 'flex-start',
      gap: '0.75rem',
      minHeight: '48px',
      padding: '12px 16px',
      fontSize: '1rem',
      fontWeight: 500,
      fontFamily: '"Inter", sans-serif',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: colors.marsala,
        backgroundColor: colors.sageLight,
      },
    },
    socialButtonsIconButton: {
      borderColor: authForm.inputBorderColor,
      backgroundColor: authForm.socialButtonBackground,
      color: authForm.textColor,
      minHeight: '48px',
      padding: '12px 16px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: colors.marsala,
        backgroundColor: colors.sageLight,
      },
    },
    socialButtonsProviderIcon: {
      // Clerk social icons rely on masked wrappers across Blink/WebKit, so both
      // standard and prefixed mask properties remain aligned. Apple keeps a
      // solid fill via explicit color override.
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '1.25rem',
      height: '1.25rem',
      flexShrink: 0,
      backgroundColor: 'transparent',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      '&.cl-providerIcon__apple': {
        backgroundColor: authForm.appleIconColor,
      },
    },
    socialButtonsBlockButtonText: {
      color: authForm.textColor,
      fontWeight: 600,
      textAlign: 'left',
      fontSize: '1rem',
    },
    dividerLine: {
      backgroundColor: authForm.inputBorderColor,
    },
    dividerText: {
      color: authForm.textColor,
      fontSize: '0.95rem',
    },
  },
};

export const userButtonClerkAppearance: NonNullable<
  UserButtonProps['appearance']
> = {
  elements: {
    avatarBox: {
      width: '36px',
      height: '36px',
    },
    userButtonPopoverCard: {
      pointerEvents: 'auto',
    },
    modalBackdrop: {
      backgroundColor: 'transparent',
    },
  },
};
