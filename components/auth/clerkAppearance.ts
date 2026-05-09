import type { SignUpProps, UserButtonProps } from '@clerk/shared/types';
import { authForm, colors } from '@/lib/design-tokens';

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
      padding: 0,
      backgroundColor: authForm.cardBackground,
      border: 'none',
      borderRadius: '12px',
      boxShadow: authForm.cardShadow,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      border: 'none',
      borderRadius: 0,
      padding: '32px 28px',
    },
    footer: {
      backgroundColor: authForm.cardBackground,
      color: authForm.textColor,
      borderTop: 'none',
      marginTop: 0,
      width: '100%',
      padding: 0,
      '& > *': {
        backgroundColor: authForm.cardBackground,
      },
      '& p': {
        color: authForm.subtleTextColor,
      },
      '& a': {
        color: authForm.textColor,
      },
      // Clerk renders two footer children: the action link (keep) and a
      // secondary wrapper (privacy/TOS). Hide the second element regardless
      // of its DOM position to avoid duplicating footer content on auth pages.
      '& > :nth-of-type(2)': {
        backgroundColor: authForm.cardBackground,
        display: 'none',
      },
    },
    footerAction: {
      backgroundColor: authForm.cardBackground,
      borderTop: 'none',
      width: '100%',
      margin: 0,
      padding: '16px 28px 24px',
      justifyContent: 'center',
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
      backgroundColor: colors.marsala,
      color: colors.white,
      fontWeight: 600,
      fontSize: '1rem',
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      padding: '12px 24px',
      minHeight: '48px',
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: colors.marsalaDark,
      },
      '&:disabled': {
        backgroundColor: colors.rosyBrown,
        color: colors.white,
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
      border: `1px solid ${authForm.footerBorderColor} !important`,
      backgroundColor: authForm.cardBackground,
      color: authForm.textColor,
      WebkitTextFillColor: authForm.textColor,
      caretColor: authForm.textColor,
      WebkitAppearance: 'none',
      appearance: 'none',
      boxShadow: 'none !important',
      WebkitBoxShadow: 'none !important',
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      '&::placeholder': {
        color: authForm.subtleTextColor,
        WebkitTextFillColor: authForm.subtleTextColor,
        opacity: 1,
      },
      '&:hover': {
        border: `1px solid ${authForm.inputBorderColor} !important`,
      },
      // Keep both selectors because Clerk mounts different input wrappers across
      // auth views and both focus states need the same override.
      '&:is(:focus, :focus-within)': {
        border: `1px solid ${authForm.inputBorderColorFocus} !important`,
        boxShadow: 'none !important',
        WebkitBoxShadow: 'none !important',
      },
    },
    formFieldInputGroup: {
      borderRadius: authForm.inputBorderRadius,
      border: `1px solid ${authForm.footerBorderColor} !important`,
      boxShadow: 'none !important',
      WebkitBoxShadow: 'none !important',
      backgroundColor: authForm.cardBackground,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        border: `1px solid ${authForm.inputBorderColor} !important`,
      },
      '&:is(:focus, :focus-within)': {
        border: `1px solid ${authForm.inputBorderColorFocus} !important`,
        boxShadow: 'none !important',
        WebkitBoxShadow: 'none !important',
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
  variables: {
    colorBackground: colors.white,
    colorForeground: authForm.textColor,
    colorMutedForeground: authForm.subtleTextColor,
    colorNeutral: authForm.inputBorderColor,
  },
  elements: {
    avatarBox: {
      width: '36px',
      height: '36px',
    },
    userButtonPopoverCard: {
      pointerEvents: 'auto',
      backgroundColor: colors.white,
      color: authForm.textColor,
    },
    userButtonPopoverMain: {
      backgroundColor: colors.white,
    },
    userButtonOuterIdentifier: {
      color: authForm.textColor,
    },
    userButtonPopoverActions: {
      backgroundColor: colors.white,
    },
    userButtonPopoverActionButton: {
      color: authForm.textColor,
      backgroundColor: colors.white,
      '&:hover': {
        backgroundColor: authForm.socialButtonBackground,
      },
    },
    userButtonPopoverActionButtonIcon: {
      color: authForm.textColor,
    },
    userButtonPopoverActionButtonIconBox: {
      color: authForm.textColor,
    },
    userPreviewMainIdentifier: {
      color: authForm.textColor,
    },
    userPreviewSecondaryIdentifier: {
      color: authForm.subtleTextColor,
    },
    userButtonPopoverFooter: {
      display: 'none',
    },
    userButtonPopoverFooterPagesLink: {
      display: 'none',
    },
    modalBackdrop: {
      backgroundColor: 'transparent',
    },
  },
};
