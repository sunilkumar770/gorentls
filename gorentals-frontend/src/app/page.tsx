import { ListingGrid } from '@/components/listing/ListingGrid';
import { Search, Camera, Wrench, Tent, Music, Gamepad2, ArrowRight, ShieldCheck, Star, Zap } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { icon: Camera,   label: 'Cameras',   query: 'cameras',     emoji: '📸', color: 'bg-green-50 text-green-700' },
  { icon: Gamepad2, label: 'Gaming',    query: 'gaming',      emoji: '🎮', color: 'bg-purple-50 text-purple-700' },
  { icon: Wrench,   label: 'Tools',     query: 'tools',       emoji: '🔧', color: 'bg-orange-50 text-orange-700' },
  { icon: Tent,     label: 'Camping',   query: 'camping',     emoji: '⛺', color: 'bg-amber-50 text-amber-700' },
  { icon: Music,    label: 'Audio',     query: 'audio',       emoji: '🎵', color: 'bg-blue-50 text-blue-700' },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'Verified owners', desc: 'Every owner is KYC-verified before listing.' },
  { icon: Star,        title: 'Rated & reviewed', desc: 'Transparent peer reviews on every item.' },
  { icon: Zap,         title: 'Instant booking',  desc: 'Confirm in seconds, pick up same day.' },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-white overflow-hidden border-b border-[#e5e7eb]">
        {/* Subtle green glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#16a34a]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#16a34a]/3 rounded-full blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold mb-8 ring-1 ring-[#16a34a]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
            Live marketplace · Hyderabad
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-[#111827] mb-6 leading-[1.05] tracking-tight max-w-3xl mx-auto">
            Rent anything,{' '}
            <span className="text-[#16a34a]">anytime</span>
          </h1>

          <p className="text-xl text-[#6b7280] max-w-xl mx-auto mb-10 leading-relaxed">
            Professional cameras, gaming gear, tools, and more — from trusted owners near you.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <form action="/search" method="GET">
              <div className="flex gap-2 bg-white border border-[#e5e7eb] rounded-2xl p-2 shadow-md">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                  <input
                    type="text"
                    name="q"
                    placeholder="What do you want to rent?"
                    className="w-full pl-12 pr-4 py-3.5 text-[#111827] placeholder-[#9ca3af] bg-transparent focus:outline-none text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-[#16a34a] text-white font-semibold rounded-xl hover:bg-[#15803d] transition-colors text-sm flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick links */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-[#9ca3af]">Popular:</span>
              {['Sony A7IV', 'Gaming Laptop', 'DJI Drone', 'Guitar'].map(term => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="text-xs text-[#16a34a] hover:underline font-medium px-2.5 py-1 bg-[#f0fdf4] rounded-full"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="bg-[#f9fafb] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#111827] mb-8 text-center">Browse by category</h2>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {CATEGORIES.map(({ icon: Icon, label, query, emoji, color }) => (
              <Link
                key={label}
                href={`/search?category=${query}`}
                className="group flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-[#e5e7eb] hover:border-[#16a34a]/30 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                  {emoji}
                </div>
                <span className="text-sm font-medium text-[#374151] group-hover:text-[#16a34a] transition-colors text-center">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Featured near you</h2>
              <p className="text-[#6b7280] text-sm mt-1">Top-rated items available now</p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#16a34a] hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ListingGrid filters={{ sort: 'rating' }} />

          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#16a34a] text-[#16a34a] font-semibold text-sm rounded-lg hover:bg-[#f0fdf4] transition-colors"
            >
              Browse all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="bg-[#f9fafb] py-16 px-4 border-t border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-2">Rent with confidence</h2>
          <p className="text-[#6b7280] mb-12">Every transaction is protected by GoRentals</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[#e5e7eb] text-left">
                <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#16a34a]" />
                </div>
                <h3 className="font-semibold text-[#111827] mb-1">{title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-[#16a34a] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Own something useful?</h2>
          <p className="text-green-100 text-lg mb-8">List it on GoRentals and earn from your idle gear.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#16a34a] font-bold rounded-xl hover:bg-green-50 transition-colors text-base"
          >
            Start listing for free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
