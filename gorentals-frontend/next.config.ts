import type { NextConfig } from "next";

// ── Build-time environment validation ──────────────────────────────────────
// Fail fast during `npm run dev` or `npm run build` if required env vars are
// missing. This prevents silent misconfiguration in staging/production.
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
] as const;

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `\n\n[GoRentals] Missing required environment variables:\n` +
    missingVars.map(v => `  ❌  ${v}`).join('\n') +
    `\n\nPlease set them in .env.local (development) or your hosting provider secrets (production).\n`
  );
}

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
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
      : 'http://localhost:8080';

    return [
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },
};

export default nextConfig;
