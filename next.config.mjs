import { fileURLToPath } from 'node:url';
import { withNextVideo } from 'next-video/process';

const __filename = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow external images from configured domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'foto.hrsstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'fh-410499-cms.s3-eu-central-1.ionoscloud.com',
      },
      {
        protocol: 'https',
        hostname: '*.ionoscloud.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // Performance optimization: Fix webpack cache serialization warning
  // Feature: 012-performance-improvement (FR-009, NFR-005)
  experimental: {
    webpackMemoryOptimizations: true,
    // Deaktiviere Turbopack persistent cache wegen lokalen Panics
    turbopackFileSystemCacheForDev: false,
  },

  webpack: (config, { _isServer, dev }) => {
    // Optimize webpack cache to avoid "Serializing big strings" warning (FR-009)
    // See: https://github.com/vercel/next.js/issues/43568
    if (dev) {
      // Development: Use filesystem cache for faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    } else {
      // Production: Use memory cache to avoid serialization warnings
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
  async redirects() {
    // Backward compatibility: consolidate protected routes
    // All legacy /protected/* paths should land on the client-guarded dashboard
    return [
      {
        source: '/protected/:path*',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default withNextVideo(nextConfig, {
  provider: 'mux',
});
