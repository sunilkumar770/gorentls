import Link from 'next/link';

const FOOTER_LINKS = {
  Discover: [
    { href: '/search',     label: 'Browse all items' },
    { href: '/categories', label: 'Categories'       },
    { href: '/stores',     label: 'Owner stores'     },
  ],
  Earn: [
    { href: '/create-listing', label: 'List your item'    },
    { href: '/insurance',      label: 'Owner protection'  },
    { href: '/earn',           label: 'How it works'      },
  ],
  Support: [
    { href: '/help',    label: 'Help Center'      },
    { href: '/terms',   label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy'   },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1a1a18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <svg
                width="32" height="32" viewBox="0 0 32 32" fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="9" fill="#01696f"/>
                <path
                  d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z"
                  fill="white"
                />
              </svg>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                GoRentals
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-[200px]">
              The peer-to-peer rental marketplace. Own less, experience more.
            </p>
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

        {/* Copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-medium">
            © {new Date().getFullYear()} GoRentals · Hyderabad, India
          </p>
          <p className="text-xs text-white/20 uppercase tracking-widest font-bold">
            The Curated Exchange
          </p>
        </div>
      </div>
    </footer>
  );
}
