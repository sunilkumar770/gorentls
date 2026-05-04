'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ListingGrid from '@/components/listing/ListingGrid';
import { CATEGORIES } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search as SearchIcon, SlidersHorizontal, X, Camera, Gamepad2,
  Wrench, Tent, Music, Package, LayoutGrid, List,
  Bike, Laptop, Car, Plane, Smartphone,
} from 'lucide-react';
import { Suspense } from 'react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'          },
  { value: 'price_asc',  label: 'Price ↑'         },
  { value: 'price_desc', label: 'Price ↓'         },
  { value: 'rating',     label: 'Top rated'       },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cameras: Camera, gaming: Gamepad2, tools: Wrench,
  camping: Tent, audio: Music, laptops: Laptop, sports: Bike,
  vehicles: Car, drones: Plane, electronics: Smartphone,
};


const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

// ── Filter Sidebar ─────────────────────────────────────────────
interface FilterSidebarProps {
  priceMin: number;
  priceMax: number;
  condition: string;
  onPriceMinChange: (v: number) => void;
  onPriceMaxChange: (v: number) => void;
  onConditionChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}

function FilterSidebar({
  priceMin, priceMax, condition,
  onPriceMinChange, onPriceMaxChange, onConditionChange,
  onApply, onClear,
}: FilterSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-2xl border border-[#01696f]/10 shadow-sm p-6 space-y-7 sticky top-28">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1a1a18]">Filters</h3>
          <button
            onClick={onClear}
            className="text-xs text-[#01696f] font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>

        {/* Price range */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#6b6b65] uppercase tracking-widest">Price per day</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-[#9b9b93] font-medium mb-1 block">Min (₹)</label>
              <input
                type="number"
                min={0}
                max={priceMax}
                value={priceMin}
                onChange={e => onPriceMinChange(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#01696f]/15 focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 text-[#1a1a18] font-medium bg-[#f7f6f2]"
              />
            </div>
            <span className="text-[#9b9b93] text-sm mt-4">–</span>
            <div className="flex-1">
              <label className="text-[11px] text-[#9b9b93] font-medium mb-1 block">Max (₹)</label>
              <input
                type="number"
                min={priceMin}
                max={10000}
                value={priceMax}
                onChange={e => onPriceMaxChange(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#01696f]/15 focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 text-[#1a1a18] font-medium bg-[#f7f6f2]"
              />
            </div>
          </div>
          {/* Price range visual bar */}
          <div className="h-1.5 bg-[#e6f4f4] rounded-full relative">
            <div
              className="absolute h-full bg-[#01696f] rounded-full"
              style={{
                left: `${(priceMin / 10000) * 100}%`,
                right: `${100 - (priceMax / 10000) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#9b9b93]">
            <span>₹0</span><span>₹10,000</span>
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#6b6b65] uppercase tracking-widest">Condition</h4>
          <div className="space-y-2">
            {CONDITIONS.map(c => (
              <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="condition"
                  value={c}
                  checked={condition === c}
                  onChange={() => onConditionChange(c)}
                  className="w-4 h-4 accent-[#01696f] cursor-pointer"
                />
                <span className={`text-sm font-medium transition-colors ${
                  condition === c ? 'text-[#01696f]' : 'text-[#6b6b65] group-hover:text-[#1a1a18]'
                }`}>
                  {c}
                </span>
              </label>
            ))}
            {condition && (
              <button
                onClick={() => onConditionChange('')}
                className="text-xs text-[#9b9b93] hover:text-[#01696f] transition-colors font-medium"
              >
                Any condition
              </button>
            )}
          </div>
        </div>

        {/* Apply button */}
        <Button
          variant="primary"
          size="md"
          onClick={onApply}
          className="w-full"
        >
          Apply Filters
        </Button>
      </div>
    </aside>
  );
}

// ── Main page ──────────────────────────────────────────────────
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery]         = useState(searchParams.get('q') ?? '');
  const [submitted, setSubmitted] = useState(searchParams.get('q') ?? '');
  const [category, setCategory]   = useState(searchParams.get('category') ?? '');
  const [sort, setSort]           = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid');

  // Filter state
  const [priceMin, setPriceMin]   = useState(0);
  const [priceMax, setPriceMax]   = useState(10000);
  const [condition, setCondition] = useState('');
  const [filtersApplied, setFiltersApplied] = useState<{ priceMin: number; priceMax: number; condition: string }>({
    priceMin: 0, priceMax: 10000, condition: '',
  });

  // Mobile filter sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Category tab overflow fade
  const tabsRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync query params → state on navigation
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setSubmitted(searchParams.get('q') ?? '');
    setCategory(searchParams.get('category') ?? '');
  }, [searchParams]);

  // Dynamic page title
  useEffect(() => {
    const parts: string[] = [];
    if (submitted) parts.push(`"${submitted}"`);
    if (category) parts.push(category.charAt(0).toUpperCase() + category.slice(1));
    document.title = parts.length > 0
      ? `${parts.join(' · ')} | Browse | GoRentals`
      : 'Browse Gear | GoRentals';
  }, [submitted, category]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  const clearSearch = () => { setQuery(''); setSubmitted(''); };

  const applyFilters = () => {
    setFiltersApplied({ priceMin, priceMax, condition });
    setFilterSheetOpen(false);
  };

  const clearFilters = () => {
    setPriceMin(0); setPriceMax(10000); setCondition('');
    setFiltersApplied({ priceMin: 0, priceMax: 10000, condition: '' });
  };

  const activeFilterCount = [
    priceMin > 0 || priceMax < 10000,
    condition !== '',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f7f6f2] pb-24">
      {/* ── Page header ──────────────────────────────────────── */}
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
              <Button type="submit" variant="primary" size="md" className="h-[46px] px-8">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Content area — sidebar + results ─────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <FilterSidebar
            priceMin={priceMin}
            priceMax={priceMax}
            condition={condition}
            onPriceMinChange={setPriceMin}
            onPriceMaxChange={setPriceMax}
            onConditionChange={setCondition}
            onApply={applyFilters}
            onClear={clearFilters}
          />

          {/* Main results column */}
          <div className="flex-1 min-w-0">

            {/* Category chips — horizontal scroll with fade gradient */}
            <div className="relative mb-6">
              <div
                ref={tabsRef}
                className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
              >
                <button
                  onClick={() => setCategory('')}
                  className={`flex-shrink-0 px-4 py-2 rounded-[var(--r-md)] text-sm font-semibold transition-all ${
                    !category
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-white text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary-muted)] hover:text-[#1a1a18]'
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
                          : 'bg-white text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--primary-muted)] hover:text-[#1a1a18]'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Right fade gradient — shows when tabs overflow */}
              {hasOverflow && (
                <div className="absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#f7f6f2] via-[#f7f6f2]/80 to-transparent pointer-events-none" />
              )}
            </div>

            {/* Sort row + view toggle + mobile filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setFilterSheetOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-[#01696f]/20 rounded-xl text-sm font-semibold text-[#1a1a18] hover:border-[#01696f]/40 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#01696f]" />
                  Filters{activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-[#01696f] text-white text-[10px] font-bold rounded-full">{activeFilterCount}</span>}
                </button>

                {/* Sort options */}
                <div className="flex items-center gap-1.5 text-sm text-[#6b6b65]">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="font-medium hidden sm:block">Sort:</span>
                  <div className="flex gap-1">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSort(opt.value as 'newest' | 'price_asc' | 'price_desc' | 'rating')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          sort === opt.value
                            ? 'bg-[#1a1a18] text-white shadow-sm'
                            : 'text-[#6b6b65] hover:bg-[#eeeee9] hover:text-[#1a1a18]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                {/* Grid / list toggle */}
                <div className="flex items-center gap-1 p-1 bg-white border border-[#01696f]/12 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#01696f] text-white' : 'text-[#9b9b93] hover:text-[#1a1a18]'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#01696f] text-white' : 'text-[#9b9b93] hover:text-[#1a1a18]'}`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <ListingGrid
              filters={{
                query: submitted,
                category: category || undefined,
                sort,
                priceMin: filtersApplied.priceMin > 0 ? filtersApplied.priceMin : undefined,
                priceMax: filtersApplied.priceMax < 10000 ? filtersApplied.priceMax : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile filter bottom sheet ────────────────────────── */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFilterSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-[#1a1a18]">Filters</h3>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f7f6f2] transition-colors"
              >
                <X className="w-5 h-5 text-[#6b6b65]" />
              </button>
            </div>

            {/* Price */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-[#6b6b65] uppercase tracking-widest">Price per day</h4>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} max={priceMax} value={priceMin}
                  onChange={e => setPriceMin(Number(e.target.value))}
                  className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-[#01696f]/15 focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 bg-[#f7f6f2]"
                  placeholder="Min ₹"
                />
                <span className="text-[#9b9b93]">–</span>
                <input
                  type="number" min={priceMin} max={10000} value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))}
                  className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-[#01696f]/15 focus:outline-none focus:ring-2 focus:ring-[#01696f]/30 bg-[#f7f6f2]"
                  placeholder="Max ₹"
                />
              </div>
            </div>

            {/* Condition */}
            <div className="space-y-3 mb-8">
              <h4 className="text-xs font-bold text-[#6b6b65] uppercase tracking-widest">Condition</h4>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCondition(condition === c ? '' : c)}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                      condition === c
                        ? 'border-[#01696f] bg-[#e6f4f4] text-[#01696f]'
                        : 'border-[#e5e5e0] text-[#6b6b65] hover:border-[#01696f]/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 border-2 border-[#01696f]/20 text-[#01696f] font-semibold rounded-xl text-sm hover:bg-[#01696f]/5 transition-colors"
              >
                Clear all
              </button>
              <Button variant="primary" size="lg" onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
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
