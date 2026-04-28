'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/ui/Logo';

const FOOTER_LINKS = {
  Discover: [
    { href: '/search',  label: 'Browse all items' },
    { href: '/stores',  label: 'Owner stores'      },
  ],
  Earn: [
    { href: '/signup?role=OWNER', label: 'List your item' },
    { href: '/pricing',           label: 'Owner pricing'  },
  ],
  Support: [
    { href: '/help',    label: 'Help Center'    },
    { href: '/terms',   label: 'Terms'          },
    { href: '/privacy', label: 'Privacy'        },
  ],
};

// ── Social icon SVGs ────────────────────────────────────────────
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  const hiddenRoutes = ['/login', '/signup', '/forgot-password', '/auth/admin-login'];
  if (hiddenRoutes.includes(pathname)) return null;

  return (
    <footer className="bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="space-y-5 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoMark size={32} className="group-hover:scale-105 transition-transform" />
              <span className="font-display text-xl font-bold text-white tracking-tight">
                GoRentals
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-[200px]">
              The peer-to-peer rental marketplace. Own less, experience more.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { href: 'https://instagram.com', Icon: InstagramIcon, label: 'Instagram' },
                { href: 'https://twitter.com',   Icon: TwitterXIcon,   label: 'Twitter/X' },
                { href: 'https://linkedin.com',  Icon: LinkedInIcon,   label: 'LinkedIn'  },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/6 text-white/50 hover:text-white hover:bg-white/12 flex items-center justify-center transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/60 hover:text-white transition-colors font-medium"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-white/8" />

        {/* Copyright row — single line, two sides */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-medium">
            © {new Date().getFullYear()} GoRentals · Hyderabad, India
          </p>
          <div className="flex items-center gap-4 text-xs text-white/25 font-medium">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms"   className="hover:text-white/50 transition-colors">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link href="/sitemap" className="hover:text-white/50 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
