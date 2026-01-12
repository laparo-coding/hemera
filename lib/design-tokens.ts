/**
 * Hemera Design Tokens
 *
 * Central source of truth for colors, typography, and spacing.
 * Import this module instead of defining tokens inline.
 */

// ============================================
// COLORS
// ============================================

export const colors = {
  /** Primary cream background - warm, inviting */
  cream: '#FBF5DD',

  /** Primary petrol text/accent - professional, trustworthy */
  petrol: '#16404D',

  /** Gold accent - premium, call-to-action */
  gold: '#DDA853',

  /** Sage accent - calming, supportive */
  sage: '#A6CDC6',

  /** Pure white for cards and contrast */
  white: '#FFFFFF',

  /** Light gray for borders and dividers */
  lightGray: '#E5E5E5',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorKey];

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  /** Serif font for headings - elegant, premium */
  heading: '"Playfair Display", serif',

  /** Sans-serif font for body - clean, readable */
  body: '"Inter", sans-serif',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ============================================
// SPACING
// ============================================

export const spacing = {
  /** Standard section vertical padding */
  sectionPy: { xs: 6, md: 10 },

  /** Reduced section padding for dense layouts */
  sectionPyCompact: { xs: 4, md: 6 },

  /** Container max width */
  containerMaxWidth: 'lg' as const,
} as const;

// ============================================
// COURSE LEVEL COLORS
// ============================================

export const courseLevelColors = {
  BEGINNER: {
    bg: colors.sage,
    text: colors.petrol,
    label: 'A',
  },
  INTERMEDIATE: {
    bg: colors.gold,
    text: colors.petrol,
    label: 'B',
  },
  ADVANCED: {
    bg: colors.petrol,
    text: colors.cream,
    label: 'C',
  },
} as const;

export type CourseLevel = keyof typeof courseLevelColors;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  /** Subtle card shadow */
  card: '0 2px 8px rgba(22, 64, 77, 0.08)',

  /** Elevated card shadow (hover state) */
  cardHover: '0 4px 16px rgba(22, 64, 77, 0.12)',

  /** Hero overlay gradient */
  heroOverlay:
    'linear-gradient(to bottom, rgba(22, 64, 77, 0.3), rgba(22, 64, 77, 0.7))',
} as const;

// ============================================
// BREAKPOINTS (MUI defaults)
// ============================================

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  heroContent: 10,
  heroOverlay: 5,
  navigation: 1000,
} as const;
