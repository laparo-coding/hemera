/**
 * SEO constants and configuration
 *
 * Centralized configuration for:
 * - Site metadata
 * - SEO limits and constraints
 * - URL configurations
 * - Social media handles
 * - Image specifications
 */

export const SITE_CONFIG = {
  name: 'Hemera Academy',
  description:
    'Transform your career with expert-led courses in technology, business, and creative skills.',
  tagline: 'Transform Your Career with Expert-Led Courses',
  url: 'https://hemera.academy',
  domain: 'hemera.academy',
} as const;

export const SEO_DEFAULTS = {
  title: {
    template: '%s | Hemera Academy',
    default: 'Hemera Academy - Transform Your Career with Expert-Led Courses',
    maxLength: 60,
  },
  description: {
    default:
      'Transform your career with expert-led courses in technology, business, and creative skills. Join thousands of students advancing their careers with Hemera Academy.',
    maxLength: 160,
  },
  keywords: [
    'online courses',
    'career development',
    'technology training',
    'professional development',
    'skill building',
    'expert instruction',
    'online learning',
    'certification',
  ],
} as const;

export const SOCIAL_CONFIG = {
  twitter: {
    handle: '@hemeraacademy',
    creator: '@hemeraacademy',
    site: '@hemeraacademy',
  },
  linkedin: {
    company: 'hemera-academy',
    url: 'https://linkedin.com/company/hemera-academy',
  },
  facebook: {
    page: 'HemeraAcademy',
    url: 'https://facebook.com/HemeraAcademy',
  },
} as const;

export const IMAGE_CONFIG = {
  og: {
    default: '/images/og-default.jpg',
    width: 1200,
    height: 630,
    alt: 'Hemera Academy - Expert-Led Online Courses',
  },
  logo: {
    default: '/images/logo.png',
    width: 200,
    height: 60,
    alt: 'Hemera Academy Logo',
  },
  favicon: {
    ico: '/favicon.ico',
    svg: '/favicon.svg',
    png192: '/images/icon-192.png',
    png512: '/images/icon-512.png',
    apple: '/images/apple-touch-icon.png',
  },
} as const;

export const ORGANIZATION_INFO = {
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}${IMAGE_CONFIG.logo.default}`,
  email: 'contact@hemera.academy',
  foundingDate: '2024',
  areaServed: 'Worldwide',
  knowsLanguage: ['en-US'],
  sameAs: [
    SOCIAL_CONFIG.twitter.handle.replace('@', 'https://twitter.com/'),
    SOCIAL_CONFIG.linkedin.url,
    SOCIAL_CONFIG.facebook.url,
  ],
} as const;

export const ROBOTS_CONFIG = {
  index: true,
  follow: true,
  noarchive: false,
  nosnippet: false,
  noimageindex: false,
  notranslate: false,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
} as const;

export const SITEMAP_CONFIG = {
  baseUrl: SITE_CONFIG.url,
  exclude: [
    '/auth/*',
    '/dashboard/*',
    '/admin/*',
    '/my-courses/*',
    '/bookings/*',
    '/api/*',
    '/_next/*',
    '/404',
    '/500',
  ],
  changeFrequency: {
    homepage: 'weekly',
    courses: 'daily',
    static: 'monthly',
  },
  priority: {
    homepage: 1.0,
    courseList: 0.9,
    individualCourse: 0.8,
    static: 0.6,
  },
} as const;

export const STRUCTURED_DATA_CONFIG = {
  organization: {
    type: 'Organization' as const,
    context: 'https://schema.org',
  },
  website: {
    type: 'WebSite' as const,
    context: 'https://schema.org',
  },
  course: {
    type: 'Course' as const,
    context: 'https://schema.org',
    inLanguage: 'en-US',
    currency: 'USD',
  },
  breadcrumb: {
    type: 'BreadcrumbList' as const,
    context: 'https://schema.org',
  },
} as const;

export const ANALYTICS_CONFIG = {
  googleAnalytics: {
    id: process.env.NEXT_PUBLIC_GA_ID || '',
    enabled: process.env.NODE_ENV === 'production',
  },
  gtm: {
    id: process.env.NEXT_PUBLIC_GTM_ID || '',
    enabled: process.env.NODE_ENV === 'production',
  },
} as const;

export const PERFORMANCE_CONFIG = {
  isr: {
    revalidate: 24 * 60 * 60, // 24 hours in seconds
    revalidateOnStale: true,
  },
  coreWebVitals: {
    lcp: 2.5, // seconds
    fid: 100, // milliseconds
    cls: 0.1, // score
  },
  lighthouse: {
    seo: 90, // minimum score
    performance: 80, // minimum score
    accessibility: 90, // minimum score
    bestPractices: 85, // minimum score
  },
} as const;

export const COURSE_CONFIG = {
  pagination: {
    defaultLimit: 12,
    maxLimit: 50,
  },
  sorting: {
    default: 'createdAt',
    options: ['createdAt', 'title', 'price', 'duration'],
  },
  filters: {
    levels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    priceRanges: [
      { min: 0, max: 0, label: 'Free' },
      { min: 1, max: 50, label: '$1 - $50' },
      { min: 51, max: 100, label: '$51 - $100' },
      { min: 101, max: 200, label: '$101 - $200' },
      { min: 201, max: 999999, label: '$200+' },
    ],
  },
} as const;

export const VALIDATION_RULES = {
  title: {
    minLength: 10,
    maxLength: 60,
  },
  description: {
    minLength: 50,
    maxLength: 160,
  },
  slug: {
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    maxLength: 50,
  },
  keywords: {
    maxCount: 10,
    maxLength: 30,
  },
} as const;

/**
 * Get full URL for a path
 */
export function getFullUrl(path: string): string {
  return `${SITE_CONFIG.url}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Validate SEO title length
 */
export function isValidTitleLength(title: string): boolean {
  return (
    title.length >= VALIDATION_RULES.title.minLength &&
    title.length <= VALIDATION_RULES.title.maxLength
  );
}

/**
 * Validate SEO description length
 */
export function isValidDescriptionLength(description: string): boolean {
  return (
    description.length >= VALIDATION_RULES.description.minLength &&
    description.length <= VALIDATION_RULES.description.maxLength
  );
}

/**
 * Validate course slug format
 */
export function isValidSlug(slug: string): boolean {
  return (
    VALIDATION_RULES.slug.pattern.test(slug) &&
    slug.length <= VALIDATION_RULES.slug.maxLength
  );
}
