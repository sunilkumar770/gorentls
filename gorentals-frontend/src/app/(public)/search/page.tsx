// src/app/(public)/search/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search as SearchIcon, SlidersHorizontal, X, Camera, Gamepad2,
  Wrench, Tent, Music, Package, LayoutGrid, List,
  Bike, Laptop, Car, Plane, Smartphone, Star, MapPin, ChevronDown,
} from 'lucide-react';
import { CATEGORIES } from '@/constants';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { getListings } from '@/services/listings';
import { Listing } from '@/types';
import Link from 'next/link';

const CONDITION_VARIANTS: Record<string, any> = {
  'New':     'brand',
  'Like New': 'info',
  'Good':     'warning',
  'Fair':     'neutral',
};

// ── Constants ─────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value:'newest',     label:'Newest'              },
  { value:'price_asc',  label:'Price: Low to High'  },
  { value:'price_desc', label:'Price: High to Low'  },
  { value:'rating',     label:'Top Rated'           },
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;
const ICON_MAP: Record<string, React.ElementType> = {
  cameras:Camera, gaming:Gamepad2, tools:Wrench, camping:Tent,
  audio:Music, laptops:Laptop, vehicles:Car, drones:Plane, electronics:Smartphone,
};

// ── Listing Card ──────────────────────────────────────────────────
function ListingCard({ listing, listView }: { listing: Listing; listView: boolean }) {
  const image = listing.listing_images?.[0]?.image_url || '/placeholder-listing.jpg';
  const ownerName = listing.stores?.store_name || listing.owner?.fullName || 'Owner';
  const city = listing.stores?.store_city || 'India';

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <Card 
        padding="none" 
        interactive 
        className={cn('group flex-col h-full', listView && 'sm:flex-row')}
      >
        <div className={cn(
          'relative overflow-hidden shrink-0 bg-surface-raised',
          listView ? 'w-full sm:w-52 h-48 sm:h-auto' : 'aspect-[4/3]'
        )}>
          <Image 
            src={image} 
            alt={listing.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500" 
            sizes="(max-width:768px) 100vw, 33vw" 
          />
          <div className="absolute top-3 left-3">
            <Badge variant="brand" size="sm">
              {listing.category}
            </Badge>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <Typography variant="label" className="mb-1 uppercase tracking-wider">{listing.category}</Typography>
          <Typography variant="h4" className="mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {listing.title}
          </Typography>
          <div className="flex items-center gap-1.5 text-text-tertiary mb-auto">
            <MapPin className="w-3.5 h-3.5" />
            <Typography variant="body-xs">{ownerName} · {city}</Typography>
          </div>
          <div className="flex items-end justify-between mt-4 pt-4 border-t border-border-subtle">
            <div>
              <Typography variant="h3" as="span">₹{listing.price_per_day.toLocaleString()}</Typography>
              <Typography variant="body-xs" as="span" className="ml-1">/day</Typography>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Typography variant="body-sm" className="font-bold">New</Typography>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────────
function FilterSidebar({ priceMax, condition, onPriceMaxChange, onConditionChange, onApply, onClear }:
  { priceMax:number; condition:string; onPriceMaxChange:(v:number)=>void; onConditionChange:(v:string)=>void; onApply:()=>void; onClear:()=>void; }) {
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <Card padding="lg" className="space-y-7 sticky top-24">
        <div className="flex items-center justify-between">
          <Typography variant="h4">Filters</Typography>
          <button onClick={onClear} className="text-xs font-semibold text-brand-600 hover:underline">Clear all</button>
        </div>
        {/* Price */}
        <div className="space-y-3">
          <Typography variant="label">Price per day</Typography>
          <input type="range" min={0} max={10000} step={100} value={priceMax}
            onChange={e => onPriceMaxChange(Number(e.target.value))}
            className="w-full accent-brand-600" />
          <div className="flex justify-between">
            <Typography variant="body-xs" className="font-semibold text-text-secondary">₹0</Typography>
            <Typography variant="body-xs" className="font-semibold text-text-secondary">₹{priceMax.toLocaleString()}</Typography>
          </div>
        </div>
        {/* Condition */}
        <div className="space-y-3">
          <Typography variant="label">Condition</Typography>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => onConditionChange(condition === c ? '' : c)}
                className={cn(
                  'py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                  condition===c ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
                )}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={onApply} fullWidth>
          Apply Filters
        </Button>
      </Card>
    </aside>
  );
}

// ── Main Content ──────────────────────────────────────────────────
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query,     setQuery]     = useState(searchParams.get('q') ?? '');
  const [submitted, setSubmitted] = useState(searchParams.get('q') ?? '');
  const [category,  setCategory]  = useState(searchParams.get('category') ?? '');
  const [sort,      setSort]      = useState<'newest'|'price_asc'|'price_desc'|'rating'>('newest');
  const [viewMode,  setViewMode]  = useState<'grid'|'list'>('grid');
  const [priceMax,  setPriceMax]  = useState(10000);
  const [condition, setCondition] = useState('');
  const [filtersApplied, setFiltersApplied] = useState({ priceMax:10000, condition:'' });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = tabsRef.current; if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setSubmitted(searchParams.get('q') ?? '');
    setCategory(searchParams.get('category') ?? '');
    const p = searchParams.get('price');
    if (p) setPriceMax(Number(p));
  }, [searchParams]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings({
          category,
          max_price: filtersApplied.priceMax,
          sort
        });
        
        // Client-side search for now since backend search is minimal
        let filtered = data;
        if (submitted) {
          filtered = data.filter(l => 
            l.title.toLowerCase().includes(submitted.toLowerCase()) ||
            l.description?.toLowerCase().includes(submitted.toLowerCase())
          );
        }
        
        setListings(filtered);
      } catch (err) {
        setError('Failed to load listings. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [category, submitted, filtersApplied, sort]);

  useEffect(() => {
    const parts: string[] = [];
    if (submitted) parts.push(`"${submitted}"`);
    if (category) parts.push(category.charAt(0).toUpperCase()+category.slice(1));
    document.title = parts.length > 0 ? `${parts.join(' · ')} | Browse | GoRentals` : 'Browse Gear | GoRentals';
  }, [submitted, category]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(query); };
  const clearSearch = () => { setQuery(''); setSubmitted(''); };
  const applyFilters = () => { setFiltersApplied({ priceMax, condition }); setFilterSheetOpen(false); };
  const clearFilters = () => { setPriceMax(10000); setCondition(''); setFiltersApplied({ priceMax:10000, condition:'' }); };
  const activeFilterCount = [priceMax < 10000, condition !== ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-subtle pb-24">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="bg-surface-base border-b border-border-subtle py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <Typography variant="label" className="mb-3">browse listings</Typography>
          <Typography variant="h1" className="mb-3">Find the perfect gear</Typography>
          <Typography variant="body-lg" className="mb-8">Discover top-rated items for rent in minutes.</Typography>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-3xl flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search cameras, laptops, drones..."
                leftIcon={<SearchIcon className="w-5 h-5" />}
                className="bg-surface-subtle border-none shadow-sm"
              />
            </div>
            <Button type="submit" size="lg" className="sm:h-12 px-8">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Desktop Sidebar */}
          <FilterSidebar 
            priceMax={priceMax} 
            condition={condition}
            onPriceMaxChange={setPriceMax} 
            onConditionChange={setCondition}
            onApply={applyFilters} 
            onClear={clearFilters} 
          />

          {/* Results column */}
          <div className="flex-1 min-w-0">

            {/* Category tabs */}
            <div className="relative mb-6">
              <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setCategory('')}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    !category ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-base text-text-secondary hover:bg-surface-overlay'
                  )}>
                  All
                </button>
                {CATEGORIES.map(c => {
                  const Icon = ICON_MAP[c.value] ?? Package;
                  return (
                    <button key={c.value} onClick={() => setCategory(c.value === category ? '' : c.value)}
                      className={cn(
                        'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                        category===c.value ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface-base text-text-secondary hover:bg-surface-overlay'
                      )}>
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {hasOverflow && <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-surface-subtle to-transparent pointer-events-none" />}
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter trigger */}
                <button onClick={() => setFilterSheetOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-surface-base border border-border-subtle rounded-xl text-sm font-semibold text-text-primary hover:bg-surface-raised transition-colors shadow-sm">
                  <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                  Filters
                  {activeFilterCount > 0 && <Badge variant="brand" size="sm" className="ml-1">{activeFilterCount}</Badge>}
                </button>
                
                {/* Active chips */}
                {submitted && (
                  <Badge variant="brand" size="md" className="gap-1.5">
                    &ldquo;{submitted}&rdquo;
                    <button onClick={clearSearch} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {category && (
                  <Badge variant="brand" size="md" className="gap-1.5">
                    {category}
                    <button onClick={() => setCategory('')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                    className="appearance-none h-10 pl-4 pr-10 bg-surface-base border border-border-subtle rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer shadow-sm">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                </div>
                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 bg-surface-base border border-border-subtle rounded-xl shadow-sm">
                  <button onClick={() => setViewMode('grid')} aria-label="Grid view"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      viewMode==='grid' ? 'bg-brand-600 text-white' : 'text-text-tertiary hover:text-text-primary'
                    )}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} aria-label="List view"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      viewMode==='list' ? 'bg-brand-600 text-white' : 'text-text-tertiary hover:text-text-primary'
                    )}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <Typography variant="body-sm" className="font-medium text-text-tertiary mb-5">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
            </Typography>

            {/* Results list */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse h-[380px] bg-surface-raised border-none" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<X className="w-10 h-10 text-error-500" />}
                title="Something went wrong"
                description={error}
                action={<Button onClick={() => window.location.reload()}>Try again</Button>}
              />
            ) : listings.length > 0 ? (
              <div className={cn(
                viewMode==='grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              )}>
                {listings.map(item => <ListingCard key={item.id} listing={item} listView={viewMode==='list'} />)}
              </div>
            ) : (
              <EmptyState
                icon={<SearchIcon className="w-10 h-10" />}
                title="No listings found"
                description="Try adjusting your filters or search terms to find what you are looking for."
                action={
                  <Button onClick={() => { clearSearch(); clearFilters(); setCategory(''); }} variant="secondary">
                    Clear all filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-normal">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface-base rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <Typography variant="h3">Filters</Typography>
              <button onClick={() => setFilterSheetOpen(false)} className="p-2 rounded-xl hover:bg-surface-subtle">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            <div className="space-y-6 mb-8">
              <div className="space-y-3">
                <Typography variant="label">Max price / day</Typography>
                <input type="range" min={0} max={10000} step={100} value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))} className="w-full accent-brand-600" />
                <div className="flex justify-between">
                  <Typography variant="body-xs" className="font-semibold text-text-secondary">₹0</Typography>
                  <Typography variant="body-xs" className="font-semibold text-text-secondary">₹{priceMax.toLocaleString()}</Typography>
                </div>
              </div>
              <div className="space-y-3">
                <Typography variant="label">Condition</Typography>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c} onClick={() => setCondition(condition===c ? '' : c)}
                      className={cn(
                        'py-2.5 px-4 rounded-xl text-sm font-semibold transition-all',
                        condition===c ? 'bg-brand-600 text-white' : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={clearFilters} variant="secondary" className="flex-1">Clear all</Button>
              <Button onClick={applyFilters} variant="primary" className="flex-1">Apply Filters</Button>
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
      <div className="min-h-screen bg-surface-subtle flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
