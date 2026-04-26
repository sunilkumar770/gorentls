"use client";

import Link from 'next/link';
import { Compass, Home, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4">
      {/* Visual Header */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-[var(--primary-light)] rounded-full flex items-center justify-center ring-8 ring-[var(--bg)]">
          <Compass className="w-16 h-16 text-[var(--primary)]" />
        </div>
        {/* Brand-aligned decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[var(--primary)]/20 scale-110 pointer-events-none" />
        <div className="absolute inset-0 rounded-full border border-[var(--primary)]/10 scale-125 pointer-events-none" />
      </div>

      <h1 className="text-8xl font-display font-bold text-[var(--text)] tracking-tighter mb-2">404</h1>
      <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-4 text-center">
        Off the map.
      </h2>
      <p className="text-[var(--text-muted)] text-center max-w-md mb-10 leading-relaxed text-sm">
        The page, listing, or store you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Quick Nav Options */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/"
          className="flex items-center gap-4 p-5 bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-card transition-all group"
        >
          <div className="w-11 h-11 bg-[var(--primary-light)] rounded-[var(--r-md)] flex items-center justify-center text-[var(--primary)] group-hover:scale-105 transition-transform flex-shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text)] text-sm">Back Home</h3>
            <p className="text-xs text-[var(--text-muted)]">Return to homepage</p>
          </div>
        </Link>

        <Link
          href="/search"
          className="flex items-center gap-4 p-5 bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-card transition-all group"
        >
          <div className="w-11 h-11 bg-[var(--bg-subtle)] rounded-[var(--r-md)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)] transition-all flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text)] text-sm">Browse Items</h3>
            <p className="text-xs text-[var(--text-muted)]">Find what you need</p>
          </div>
        </Link>
      </div>

      {/* Footer support link */}
      <div className="mt-12 text-center">
        <Link href="/help" className="inline-flex items-center gap-2 text-sm text-[var(--text-faint)] hover:text-[var(--primary)] transition-colors font-medium">
          <HelpCircle className="w-4 h-4" /> Need assistance? Visit our Help Center
        </Link>
      </div>
    </div>
  );
}
