'use client';

import { useState, useEffect } from 'react';
import ListingGrid from '@/components/listing/ListingGrid';
import {
  Search, Camera, Wrench, Tent, Music, Gamepad2, ArrowRight,
  ShieldCheck, Star, Zap, MapPin, Lock, CreditCard,
  Bike, Laptop, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = [
  { icon: Camera,   label: 'Cameras',  query: 'cameras',  count: 14 },
  { icon: Gamepad2, label: 'Gaming',   query: 'gaming',   count: 9  },
  { icon: Wrench,   label: 'Tools',    query: 'tools',    count: 21 },
  { icon: Tent,     label: 'Camping',  query: 'camping',  count: 7  },
  { icon: Music,    label: 'Audio',    query: 'audio',    count: 12 },
  { icon: Laptop,   label: 'Laptops',  query: 'laptops',  count: 18 },
  { icon: Bike,     label: 'Sports',   query: 'sports',   count: 6  },
];

export default function Home() {
  const { user, isRenter } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="font-sans bg-card">
      {/* ── Offline Banner ──────────────────────────────── */}
      {isOffline && (
        <div className="bg-[#FEF3C7] text-[#92400E] text-sm font-medium py-3 px-4 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Offline Mode — API not connected</span>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-subtle overflow-hidden rounded-b-[40px] md:rounded-b-[60px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card text-[#4F46E5] text-xs font-semibold mb-8 shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Hyderabad, India
              <span className="text-[#4F46E5]/60 ml-0.5">↗</span>
            </Link>

            <h1 className="text-6xl md:text-8xl font-bold text-text mb-8 leading-tight tracking-tight">
              Rent Anything.
            </h1>

            <p className="text-xl md:text-2xl text-muted mb-12 leading-relaxed max-w-2xl">
              Join <span className="font-semibold text-text">10,000+</span> users renting professional gear, tools, and electronics from trusted locals.
            </p>

            <form action="/search" method="GET" className="w-full max-w-3xl mb-10">
              {/* No-Line rule: using background shift and shadow instead of borders */}
              <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-5 w-6 h-6 text-faint" />
                  <Input
                    type="text"
                    name="q"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search cameras, laptops, drones..."
                    className="w-full pl-14 h-14 bg-transparent border-0 ring-0 focus:ring-0 text-text placeholder:text-faint text-lg md:text-xl font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="h-14 px-8 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[20px] text-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Browse all gear
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Category grid ────────────────────────────────────────── */}
      <section className="bg-card py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-text tracking-tight">Explore Categories</h2>
              <p className="text-muted mt-3 text-lg">Find exactly what you need</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {CATEGORIES.map(({ icon: Icon, label, query, count }) => (
              <Link
                key={label}
                href={`/search?category=${query}`}
                className="group flex flex-col items-center p-8 bg-subtle rounded-[32px] hover:bg-card hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-sm mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-[#4F46E5]" strokeWidth={1.5} />
                </div>
                <span className="text-base font-semibold text-text group-hover:text-[#4F46E5] transition-colors mb-1">
                  {label}
                </span>
                <span className="text-sm font-medium text-muted">
                  {count} items
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────────────── */}
      <section className="bg-subtle py-24 px-4 rounded-[40px] md:rounded-[60px] mx-2 md:mx-4 my-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-text tracking-tight">Recently listed</h2>
              <p className="text-muted mt-3 text-lg">Fresh gear from your community</p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 text-base font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
            >
              View all <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <ListingGrid
            filters={{ sort: 'newest' }}
            emptyTitle="No listings yet"
            emptyBody="Be the first to list your gear in this category."
          />
        </div>
      </section>

      {/* ── Why GoRentals ──────────────────────────────────────── */}
      <section className="bg-card py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-text mb-5 tracking-tight">Why GoRentals</h2>
            <p className="text-muted text-xl">Every transaction is backed by our guarantee</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-subtle rounded-[40px] p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-card rounded-[24px] flex items-center justify-center shadow-sm mb-8">
                <ShieldCheck className="w-10 h-10 text-[#4F46E5]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-text mb-4">KYC Verified</h3>
              <p className="text-muted text-lg leading-relaxed">
                Every owner completes identity verification before listing.
              </p>
            </div>

            <div className="bg-subtle rounded-[40px] p-10 flex flex-col items-center text-center transform md:-translate-y-8">
              <div className="w-20 h-20 bg-card rounded-[24px] flex items-center justify-center shadow-sm mb-8">
                <Lock className="w-10 h-10 text-[#4F46E5]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-text mb-4">Escrow Protected</h3>
              <p className="text-muted text-lg leading-relaxed">
                Deposits are held securely until the rental is successfully completed.
              </p>
            </div>

            <div className="bg-subtle rounded-[40px] p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-card rounded-[24px] flex items-center justify-center shadow-sm mb-8">
                <Star className="w-10 h-10 text-[#4F46E5]" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-text mb-4">Trusted Ratings</h3>
              <p className="text-muted text-lg leading-relaxed">
                Peer-reviewed listings ensure you always get high-quality gear.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
