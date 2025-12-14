import type { MetadataRoute } from 'next';
import { SITEMAP_CONFIG } from '../lib/seo/constants';

/**
 * Robots.txt configuration
 *
 * Provides SEO-friendly robots.txt with:
 * - Allow crawling of public pages
 * - Disallow crawling of sensitive paths
 * - Sitemap reference
 * - Security-focused exclusions
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITEMAP_CONFIG.baseUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...SITEMAP_CONFIG.exclude],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [...SITEMAP_CONFIG.exclude],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
