import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // NOTE: Do NOT use output: 'export' — that disables API routes (needed for AI features)
  images: {
    unoptimized: true
  },
  output: 'standalone',
  transpilePackages: ['forgecad'],
  serverExternalPackages: ['manifold-3d'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            crypto: false,
            os: false,
        };
    }
    return config;
  },
};

export default nextConfig;
