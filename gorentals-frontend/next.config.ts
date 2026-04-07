import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        // Allow http sources — needed for mock/test listing images
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
