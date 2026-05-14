import type { NextConfig } from "next";

// ── Build-time environment validation ──────────────────────────────────────
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
] as const;

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `\n\n[GoRentals] Missing required environment variables:\n` +
    missingVars.map(v => ` ❌ ${v}`).join('\n') +
    `\n\nPlease set them in .env.local (development) or your hosting provider secrets (production).\n`
  );
}

const isProd = process.env.NODE_ENV === 'production';

// ── H-1 Fix: Restrict image remotePatterns to known trusted hostnames ───────
// Do NOT use hostname: '**' — it opens an SSRF vector via Next.js image proxy.
// Only add origins where GoRentals actually stores images.
const trustedImagePatterns: NextConfig['images'] = {
  remotePatterns: [
    // Supabase storage (for listing images, profile photos)
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.in',
      pathname: '/storage/v1/object/public/**',
    },
    // Cloudinary (if used for image optimization)
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
    // Google profile pictures (OAuth)
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
    },
    {
      protocol: 'https',
      hostname: 'lh4.googleusercontent.com',
    },
    // GitHub profile pictures
    {
      protocol: 'https',
      hostname: 'avatars.githubusercontent.com',
    },
    // Local development — http allowed ONLY in non-production
    ...(!isProd ? [
      {
        protocol: 'http' as const,
        hostname: 'localhost',
      },
      {
        protocol: 'http' as const,
        hostname: '127.0.0.1',
      },
    ] : []),
  ],
};

const nextConfig: NextConfig = {
  images: trustedImagePatterns,
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
  async redirects() {
    return [
      {
        source: '/listings',
        destination: '/search',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
