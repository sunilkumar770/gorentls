'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ListingGrid from '@/components/listing/ListingGrid';
import { CATEGORIES } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search as SearchIcon, SlidersHorizontal, X, Camera, Gamepad2, Wrench, Tent, Music, Package } from 'lucide-react';
import { Suspense } from 'react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first'        },
  { value: 'price_asc',  label: 'Price: Low to high'  },
  { value: 'price_desc', label: 'Price: High to low'  },
  { value: 'rating',     label: 'Top rated'           },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cameras: Camera, gaming: Gamepad2, tools: Wrench,
  camping: Tent, audio: Music,
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery]     = useState(searchParams.get('q') ?? '');
  const [submitted, setSubmitted] = useState(searchParams.get('q') ?? '');
  const [category, setCategory]   = useState(searchParams.get('category') ?? '');
  const [sort, setSort]       = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');

  // Sync query params → state on navigation
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setSubmitted(searchParams.get('q') ?? '');
    setCategory(searchParams.get('category') ?? '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  const clearSearch = () => {
    setQuery('');
    setSubmitted('');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] pb-24">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#01696f]/8 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-[#1a1a18] mb-6">
            Browse listings
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex gap-2 items-end">
              <div className="relative flex-1">
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search cameras, laptops, drones..."
                  icon={<SearchIcon className="w-5 h-5" />}
                  className="bg-[var(--bg-faint)] border-[var(--border)]"
                />
                {query && (
                  <button type="button" onClick={clearSearch}
                    className="absolute right-3 top-[23px] text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="h-[46px] px-8"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Filters & results ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Category chips — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          <button
            onClick={() => setCategory('')}
            className={`flex-shrink-0 px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold transition-all ${
              !category
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-white text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary-muted)]'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(c => {
            const Icon = CATEGORY_ICONS[c.value] ?? Package;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value === category ? '' : c.value)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold transition-all ${
                  category === c.value
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-white text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary-muted)]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Sort row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-[#6b6b65]">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium">Sort by:</span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sort === opt.value
                      ? 'bg-[#1a1a18] text-white'
                      : 'text-[#6b6b65] hover:bg-[#eeeee9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          <div className="flex gap-2 flex-wrap">
            {submitted && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01696f]/10 text-[#01696f] text-xs font-semibold rounded-lg border border-[#01696f]/15">
                &ldquo;{submitted}&rdquo;
                <button onClick={clearSearch} className="hover:text-[#015a5f]"><X className="w-3 h-3" /></button>
              </span>
            )}
            {category && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#01696f]/10 text-[#01696f] text-xs font-semibold rounded-lg border border-[#01696f]/15">
                {category}
                <button onClick={() => setCategory('')} className="hover:text-[#015a5f]"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <ListingGrid
          filters={{ query: submitted, category: category || undefined, sort }}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#01696f]/20 border-t-[#01696f] animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
