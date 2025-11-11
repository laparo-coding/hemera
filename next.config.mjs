import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize webpack cache for client-side builds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
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

export default nextConfig;
