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
  /** Warm beige – background color, inviting and soft */
  beige: '#EBE2D3',

  /** Muted marsala red – primary color for headings and accents */
  marsala: '#884143',

  /** Warm bronze brown – secondary color for call-to-actions */
  bronze: '#926A49',

  /** Rosy brown – subtle accent, calming */
  rosyBrown: '#bc8f8f',

  /** Pure white – cards and contrast surfaces */
  white: '#FFFFFF',

  /** Light gray – borders and dividers */
  lightGray: '#E5E5E5',

  /** Light black – body text, easy to read */
  lightBlack: '#2D2D2D',

  /** Pure black – success indicators */
  success: '#000000',

  /** Signal red – warnings and errors */
  warning: '#FF0000',

  /** Marsala dark – hover/active state for marsala buttons */
  marsalaDark: '#6B3234',

  /** Bronze hover – lighter bronze for hover states */
  bronzeHover: '#C99545',

  /** White overlay – semi-transparent white for hover on dark backgrounds */
  whiteOverlay15: 'rgba(255, 255, 255, 0.15)',

  /** Sage light – subtle sage green tint for backgrounds */
  sageLight: 'rgba(166, 205, 198, 0.1)',

  /** Bronze light – subtle bronze tint for hover/drag backgrounds */
  bronzeLight: 'rgba(221, 168, 83, 0.1)',

  /** Info main – sage green for informational elements */
  infoMain: '#5B9A8B',

  /** Info light – lighter sage green */
  infoLight: '#7DB8AB',

  /** Info dark – darker sage green */
  infoDark: '#3E7A6D',
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
    bg: colors.rosyBrown,
    text: colors.marsala,
    label: 'A',
  },
  INTERMEDIATE: {
    bg: colors.bronze,
    text: colors.marsala,
    label: 'B',
  },
  ADVANCED: {
    bg: colors.marsala,
    text: colors.beige,
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
