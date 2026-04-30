'use client';

import { useState, useEffect } from 'react';
import ListingGrid from '@/components/listing/ListingGrid';
import {
  Search, Camera, Wrench, Tent, Music, Gamepad2, ArrowRight,
  ShieldCheck, Star, Zap, TrendingUp, MapPin, Lock, CreditCard,
  X, Bike, Laptop,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

// ── Categories — all teal, consistent ──────────────────────────
const CATEGORIES = [
  { icon: Camera,   label: 'Cameras',  query: 'cameras',  count: 14 },
  { icon: Gamepad2, label: 'Gaming',   query: 'gaming',   count: 9  },
  { icon: Wrench,   label: 'Tools',    query: 'tools',    count: 21 },
  { icon: Tent,     label: 'Camping',  query: 'camping',  count: 7  },
  { icon: Music,    label: 'Audio',    query: 'audio',    count: 12 },
  { icon: Laptop,   label: 'Laptops',  query: 'laptops',  count: 18 },
  { icon: Bike,     label: 'Sports',   query: 'sports',   count: 6  },
];

// ── Trust bar items ─────────────────────────────────────────────
const TRUST_ITEMS = [
  { Icon: ShieldCheck, value: 'KYC Verified',       label: 'Every owner'       },
  { Icon: Lock,        value: 'Escrow',             label: 'Deposit protection' },
  { Icon: CreditCard,  value: 'Razorpay',           label: 'Secure payments'   },
  { Icon: MapPin,      value: 'Hyderabad',          label: 'Based in India'    },
];

export default function Home() {
  const { user, isRenter } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Persist banner dismissal
  useEffect(() => {
    setBannerDismissed(localStorage.getItem('banner_live_dismissed') === 'true');
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('banner_live_dismissed', 'true');
  };

  return (
    <>
      {/* ── Announcement Banner ──────────────────────────────── */}
      {!bannerDismissed && !isRenter && (
        <div className="bg-[#01696f] text-white text-sm font-medium py-2.5 px-4 flex items-center justify-center gap-2 relative">
          <span>🎉 GoRentals is now live in Hyderabad — List your gear today!</span>
          <Link href="/signup" className="font-bold underline underline-offset-2 hover:text-white/80 transition-colors ml-1">
            Get started →
          </Link>
          <button
            onClick={dismissBanner}
            className="absolute right-4 p-1 rounded-md hover:bg-white/15 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-[#f7f6f2] overflow-hidden">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-[#01696f]/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-0 w-[300px] h-[300px] bg-[#01696f]/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — Copy & Search */}
            <div>
              {/* Location badge — clickable button */}
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#01696f]/10 text-[#01696f] text-xs font-semibold mb-8 border border-[#01696f]/15 hover:bg-[#01696f]/15 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                Hyderabad, India
                <span className="text-[#01696f]/60 ml-0.5">↗</span>
              </Link>

              <h1 className="text-5xl md:text-6xl font-display font-bold text-[#1a1a18] mb-6 leading-[1.05] tracking-tight">
                Rent anything,{' '}
                <span className="text-[#01696f]">anytime</span>
              </h1>

              <p className="text-lg text-[var(--text-muted)] max-w-md mb-10 leading-relaxed">
                Professional gear, tools, and electronics — from trusted, KYC-verified owners near you.
              </p>

              {/* Search bar */}
              <form action="/search" method="GET" className="mb-8">
                <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-card border border-[var(--border)]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9b93]" />
                    <Input
                      type="text"
                      name="q"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search cameras, laptops, drones..."
                      className="pl-10 bg-transparent border-none focus:ring-0"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="px-8"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {/* CTAs — clear primary / subtle secondary hierarchy */}
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="lg" asChild className="gap-2">
                  <Link href="/search">
                    Browse all gear <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                {/* Secondary as a text link — clear visual hierarchy */}
                {(!user || !isRenter) && (
                  <Link
                    href="/signup"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#01696f] hover:text-[#015a5f] group transition-colors"
                  >
                    List your gear
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right — Masonry gear photos */}
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-3 h-[420px]">
              <div className="relative col-span-1 row-span-2 rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80"
                  alt="Camera gear for rent"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 25vw"
                  priority
                />
              </div>
              <div className="relative col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400&q=80"
                  alt="DJI Drone for rent"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 20vw"
                  priority
                />
              </div>
              <div className="relative col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80"
                  alt="Laptop for rent"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 20vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip — icons + labels ──────────────────────── */}
      <div className="bg-[#01696f] text-white py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-0 md:divide-x md:divide-white/20">
          {TRUST_ITEMS.map(({ Icon, value, label }, i) => (
            <div key={label} className="flex items-center gap-3 px-8 py-2">
              <Icon className="w-6 h-6 text-white/80 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-display font-bold leading-tight">{value}</p>
                <p className="text-[11px] text-white/60 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories — horizontal scroll, all teal ──────────── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-[var(--text)]">Browse by category</h2>
              <p className="text-[var(--text-muted)] mt-1">Explore high-quality gear in every niche</p>
            </div>
            <Link href="/search" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#01696f] hover:text-[#015a5f] group transition-colors">
              All categories <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Horizontal scroll row */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {CATEGORIES.map(({ icon: Icon, label, query, count }) => (
              <Link
                key={label}
                href={`/search?category=${query}`}
                className="group flex-shrink-0 flex flex-col items-center gap-3 p-5 bg-[var(--bg-faint)] rounded-2xl hover:bg-white hover:shadow-card-hover transition-all duration-200 border border-transparent hover:border-[#01696f]/20 min-w-[120px]"
              >
                {/* Icon — always teal */}
                <div className="w-14 h-14 bg-[#e6f4f4] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-7 h-7 text-[#01696f]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-[var(--text)] group-hover:text-[#01696f] transition-colors text-center">
                  {label}
                </span>
                {/* Listing count */}
                <span className="text-[11px] font-medium text-[#9b9b93]">
                  {count} items
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────────────── */}
      <section className="bg-[#f7f6f2] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-[#1a1a18]">Recently listed</h2>
              <p className="text-[#6b6b65] mt-1.5">Verified gear from trusted owners near you</p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#01696f] hover:text-[#015a5f] group transition-colors"
            >
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ListingGrid
            filters={{ sort: 'newest' }}
            emptyTitle="No listings yet — be the first!"
            emptyBody="We're just getting started. List your gear and be among the first owners on GoRentals."
            emptyAction={
              !isRenter && (
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#01696f] text-white text-sm font-bold rounded-xl hover:bg-[#015a5f] transition-colors"
                >
                  List your first item →
                </Link>
              )
            }
          />

          <div className="text-center mt-10 sm:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#01696f]/20 text-[#01696f] font-semibold text-sm rounded-xl hover:bg-[#01696f]/5 transition-colors"
            >
              Browse all items <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why GoRentals — asymmetric layout ─────────────────── */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-bold text-[#1a1a18] mb-3">Why GoRentals</h2>
            <p className="text-[#6b6b65] text-lg">Every transaction is backed by the GoRentals guarantee</p>
          </div>

          {/* Asymmetric 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Large left card */}
            <div className="bg-[#01696f] text-white rounded-3xl p-10 flex flex-col justify-between min-h-[280px]">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-8">
                <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">Trust & Safety</p>
                <h3 className="text-2xl font-display font-bold mb-3">Verified owners</h3>
                <p className="text-white/75 leading-relaxed">
                  Every owner completes KYC verification before listing. Your rental is backed by real identity — not just an email address.
                </p>
              </div>
            </div>

            {/* Right — two stacked cards */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#f7f6f2] rounded-3xl p-8 flex items-start gap-5">
                <div className="w-12 h-12 bg-[#01696f]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-[#01696f]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-[#1a1a18] mb-2">Rated & reviewed</h3>
                  <p className="text-sm text-[#6b6b65] leading-relaxed">
                    Peer-reviewed listings with verified ratings on every item and owner.
                  </p>
                </div>
              </div>

              <div className="bg-[#f7f6f2] rounded-3xl p-8 flex items-start gap-5">
                <div className="w-12 h-12 bg-[#01696f]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-[#01696f]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-[#1a1a18] mb-2">Instant booking</h3>
                  <p className="text-sm text-[#6b6b65] leading-relaxed">
                    Confirm your booking in seconds and pick up your gear same day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-4 bg-[#1a1a18]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_#01696f_0%,_transparent_65%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold mb-8 border border-white/10">
            <TrendingUp className="w-3.5 h-3.5" />
            Earn passive income
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Turn idle gear into income
          </h2>
          <p className="text-[#9b9b93] text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of verified owners who earn from their cameras, tools, and electronics every week.
          </p>
          {(!user || !isRenter) && (
            <Button
              variant="primary"
              size="lg"
              className="px-12 py-7 text-lg rounded-2xl"
              asChild
            >
              <Link href="/signup">
                List your first item <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
