/**
 * Schema.org JSON-LD generators for structured data
 *
 * Provides type-safe generation of structured data for:
 * - Organization schema
 * - WebPage schema
 * - BreadcrumbList schema
 * - WebSite schema with search action
 */

const ORGANIZATION_CONFIG = {
  name: 'Hemera Academy',
  description:
    'Transform your career with expert-led courses in technology, business, and creative skills.',
  url: 'https://hemera.academy',
  logo: 'https://hemera.academy/images/logo.png',
  email: 'contact@hemera.academy',
  phone: '+1-555-HEMERA',
  address: {
    streetAddress: '123 Education Street',
    addressLocality: 'Learning City',
    addressRegion: 'ED',
    postalCode: '12345',
    addressCountry: 'US',
  },
  sameAs: [
    'https://twitter.com/hemeraacademy',
    'https://linkedin.com/company/hemera-academy',
    'https://facebook.com/hemeraacademy',
  ],
};

/**
 * Generate Organization schema for the main organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORGANIZATION_CONFIG.name,
    description: ORGANIZATION_CONFIG.description,
    url: ORGANIZATION_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: ORGANIZATION_CONFIG.logo,
      width: 600,
      height: 60,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: ORGANIZATION_CONFIG.phone,
      contactType: 'Customer Service',
      email: ORGANIZATION_CONFIG.email,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: ORGANIZATION_CONFIG.address.streetAddress,
      addressLocality: ORGANIZATION_CONFIG.address.addressLocality,
      addressRegion: ORGANIZATION_CONFIG.address.addressRegion,
      postalCode: ORGANIZATION_CONFIG.address.postalCode,
      addressCountry: ORGANIZATION_CONFIG.address.addressCountry,
    },
    sameAs: ORGANIZATION_CONFIG.sameAs,
  };
}

/**
 * Generate WebPage schema for general pages
 */
export function generateWebPageSchema({
  title,
  description,
  url,
  type = 'WebPage',
}: {
  title: string;
  description: string;
  url: string;
  type?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: ORGANIZATION_CONFIG.name,
      url: ORGANIZATION_CONFIG.url,
    },
    about: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_CONFIG.name,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: ORGANIZATION_CONFIG.logo,
      },
    },
    inLanguage: 'en-US',
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORGANIZATION_CONFIG.name,
    description: ORGANIZATION_CONFIG.description,
    url: ORGANIZATION_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${ORGANIZATION_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_CONFIG.name,
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Generate Course schema for individual courses
 */
export function generateCourseSchema(course: {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  price?: number | null;
}) {
  const courseSlug = course.slug ?? course.id;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || 'Professional course content',
    provider: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_CONFIG.name,
      url: ORGANIZATION_CONFIG.url,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      duration: 'P8H', // 8 hours
    },
    offers: {
      '@type': 'Offer',
      price: course.price ? (course.price / 100).toString() : '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    url: `${ORGANIZATION_CONFIG.url}/courses/${courseSlug}`,
    inLanguage: 'de-DE',
  };
}

/**
 * Predefined schema combinations for different page types
 */
export const SCHEMA_COMBINATIONS = {
  homepage: () => [
    generateOrganizationSchema(),
    generateWebSiteSchema(),
    generateWebPageSchema({
      title: `${ORGANIZATION_CONFIG.name} - Online Learning Platform`,
      description: ORGANIZATION_CONFIG.description,
      url: ORGANIZATION_CONFIG.url,
      type: 'CollectionPage',
    }),
  ],
  courseList: (
    courses: Array<{
      id: string;
      slug?: string | null;
      title: string;
      description?: string | null;
      price?: number | null;
    }> = []
  ) => [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `Courses - ${ORGANIZATION_CONFIG.name}`,
      description: `Browse our complete catalog of expert-led courses at ${ORGANIZATION_CONFIG.name}.`,
      url: `${ORGANIZATION_CONFIG.url}/courses`,
      type: 'CollectionPage',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: ORGANIZATION_CONFIG.url },
      { name: 'Courses', url: `${ORGANIZATION_CONFIG.url}/courses` },
    ]),
    ...courses.map(course => generateCourseSchema(course)),
  ],
  academyPage: () => [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: 'Hemera Academy – Über unsere Kurse',
      description:
        'Erfahre mehr über die Hemera Academy: Ziele, Lernformate und wie du mit unseren Kursen durchstartest.',
      url: `${ORGANIZATION_CONFIG.url}/academy`,
      type: 'WebPage',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: ORGANIZATION_CONFIG.url },
      { name: 'Academy', url: `${ORGANIZATION_CONFIG.url}/academy` },
    ]),
  ],
  aboutPage: () => [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `About ${ORGANIZATION_CONFIG.name}`,
      description: `Learn more about ${ORGANIZATION_CONFIG.name} and our mission to provide quality education.`,
      url: `${ORGANIZATION_CONFIG.url}/about`,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: ORGANIZATION_CONFIG.url },
      { name: 'About', url: `${ORGANIZATION_CONFIG.url}/about` },
    ]),
  ],
  contactPage: () => [
    generateOrganizationSchema(),
    generateWebPageSchema({
      title: `Contact ${ORGANIZATION_CONFIG.name}`,
      description: `Get in touch with ${ORGANIZATION_CONFIG.name} for questions about our courses and services.`,
      url: `${ORGANIZATION_CONFIG.url}/contact`,
      type: 'ContactPage',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: ORGANIZATION_CONFIG.url },
      { name: 'Contact', url: `${ORGANIZATION_CONFIG.url}/contact` },
    ]),
  ],
};
