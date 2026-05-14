import type { NextConfig } from "next";

// ── Build-time environment validation ─────────────────────────────
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
] as const;

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(
    `\n\n[GoRentals] Missing required environment variables:\n` +
      missingVars.map((v) => `  X ${v}`).join('\n') +
      `\n\nPlease set them in .env.local (development) or your hosting provider secrets (production).\n`
  );
}

const isProd = process.env.NODE_ENV === 'production';

// ── H-1 Fix: Restrict image remotePatterns to known trusted hostnames ──────
// Do NOT use hostname: '**' – it opens an SSRF vector via Next.js image proxy.
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
  ],
};

// ── Security Headers ───────────────────────────────────────────────
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// Derive the backend origin (protocol + host, no path)
const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:8080';
  }
})();

// Content Security Policy – tightly restrict what the browser can load/run
// 'strict-dynamic' allows Next.js inline scripts with nonce in future
const csp = [
  `default-src 'self'`,
  // Scripts: self + Razorpay checkout SDK
  `script-src 'self' 'unsafe-eval' https://checkout.razorpay.com`,
  // Styles: self + inline (Tailwind / Radix UI inject inline styles)
  `style-src 'self' 'unsafe-inline'`,
  // Images: self + data URIs + trusted image CDNs
  `img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://res.cloudinary.com`,
  // Fonts: self
  `font-src 'self'`,
  // API / WebSocket connections
  `connect-src 'self' ${apiOrigin} wss://${apiOrigin.replace(/^https?:\/\//, '')}`,
  // Razorpay iframes for payment UI
  `frame-src https://api.razorpay.com https://checkout.razorpay.com`,
  // Workers (Next.js service worker)
  `worker-src 'self' blob:`,
  // No plugins, no embedded objects
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // Block all mixed content
  `upgrade-insecure-requests`,
].join('; ');

const nextConfig: NextConfig = {
  images: trustedImagePatterns,

  async headers() {
    return [
      {
        // Apply security headers to ALL routes
        source: '/(.*)',
        headers: [
          // ── H-3 Security headers (previously existing) ──
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },

          // ── NEW: HSTS – force HTTPS for 1 year, include subdomains ──
          // Only effective in production (Render serves HTTPS automatically)
          ...(isProd
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),

          // ── NEW: Content Security Policy ──
          { key: 'Content-Security-Policy', value: csp },

          // ── NEW: Prevent clickjacking (belt-and-suspenders with X-Frame-Options) ──
          { key: 'X-XSS-Protection', value: '0' }, // Modern browsers use CSP; this header is legacy
        ],
      },
    ];
  },
};

export default nextConfig;
