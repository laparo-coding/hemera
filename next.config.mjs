import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimization: Fix webpack cache serialization warning
  // Feature: 012-performance-improvement (FR-009, NFR-005)
  experimental: {
    webpackMemoryOptimizations: true,
  },

  webpack: (config, { _isServer, dev, webpack }) => {
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

    // CI fix: Replace Google Font imports with local fallback in CI environments
    // to avoid build failures when external network access is restricted
    const isCI = process.env.CI === 'true';
    const isVercel = !!process.env.VERCEL;

    if (isCI && !isVercel) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /lib[\\/]fonts\.google/,
          './fonts.local.ts'
        )
      );
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

export default nextConfig;
