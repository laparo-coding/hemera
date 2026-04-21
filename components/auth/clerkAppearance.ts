import type { SignUpProps, UserButtonProps } from '@clerk/shared/types';
import { colors } from '@/lib/design-tokens';

export const authPageClerkAppearance: NonNullable<SignUpProps['appearance']> = {
  variables: {
    colorPrimary: colors.marsala,
    colorTextOnPrimaryBackground: colors.beige,
    colorBackground: colors.white,
    colorInputBackground: colors.white,
    colorInputText: colors.marsala,
    borderRadius: '8px',
  },
  elements: {
    card: {
      boxShadow: 'none',
      border: 'none',
    },
    headerTitle: {
      fontFamily: '"Playfair Display", serif',
      color: colors.marsala,
      fontSize: '1.75rem',
    },
    headerSubtitle: {
      display: 'none',
    },
    formButtonPrimary: {
      backgroundColor: colors.bronze,
      color: colors.marsala,
      fontWeight: 600,
      '&:hover': {
        backgroundColor: colors.bronzeHover,
      },
    },
    formFieldInput: {
      borderRadius: '8px',
      borderColor: colors.rosyBrown,
      '&:focus': {
        borderColor: colors.marsala,
      },
    },
    footerActionLink: {
      color: colors.marsala,
      fontWeight: 600,
      '&:hover': {
        color: colors.bronze,
      },
    },
    socialButtonsBlockButton: {
      borderColor: colors.rosyBrown,
      color: colors.marsala,
      '&:hover': {
        borderColor: colors.marsala,
        backgroundColor: colors.sageLight,
      },
    },
    dividerLine: {
      backgroundColor: colors.rosyBrown,
    },
    dividerText: {
      color: colors.marsala,
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
