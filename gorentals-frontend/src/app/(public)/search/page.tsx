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

// ── Types ─────────────────────────────────────────────────────────
interface MockListing {
  id: number; title: string; owner: string; city: string;
  category: string; condition: 'New' | 'Like New' | 'Good' | 'Fair';
  price: number; rating: number; reviews: number; image: string;
}

// ── Mock Data ─────────────────────────────────────────────────────
const MOCK_LISTINGS: MockListing[] = [
  { id:1,  title:'Sony A7 III Full-Frame Camera',   owner:'Rahul S.',   city:'Hyderabad', category:'cameras',     condition:'Like New', price:1200, rating:4.9, reviews:34, image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80' },
  { id:2,  title:'DJI Mini 3 Pro Drone',             owner:'Priya K.',   city:'Bengaluru', category:'drones',      condition:'Good',     price:1800, rating:4.7, reviews:21, image:'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&q=80' },
  { id:3,  title:'MacBook Pro 16" M3',               owner:'Aarav M.',   city:'Mumbai',    category:'laptops',     condition:'New',      price:2500, rating:5.0, reviews:12, image:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80' },
  { id:4,  title:'Rode VideoMic Pro+ Microphone',    owner:'Sneha T.',   city:'Chennai',   category:'audio',       condition:'Like New', price:450,  rating:4.8, reviews:18, image:'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80' },
  { id:5,  title:'Dewalt Power Drill Set',            owner:'Kiran R.',   city:'Pune',      category:'tools',       condition:'Good',     price:300,  rating:4.6, reviews:29, image:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80' },
  { id:6,  title:'Coleman 6-Person Camping Tent',    owner:'Anita P.',   city:'Delhi',     category:'camping',     condition:'Good',     price:600,  rating:4.5, reviews:15, image:'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&q=80' },
  { id:7,  title:'PlayStation 5 Console',             owner:'Dev J.',     city:'Hyderabad', category:'gaming',      condition:'Like New', price:800,  rating:4.8, reviews:41, image:'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80' },
  { id:8,  title:'Royal Enfield Classic 350',         owner:'Vijay N.',   city:'Bengaluru', category:'vehicles',    condition:'Good',     price:1500, rating:4.4, reviews:9,  image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { id:9,  title:'Canon EOS R5 with 24-70mm Lens',   owner:'Meera L.',   city:'Hyderabad', category:'cameras',     condition:'New',      price:2200, rating:4.9, reviews:27, image:'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80' },
  { id:10, title:'iPad Pro 12.9" M2 with Pencil',    owner:'Ravi G.',    city:'Mumbai',    category:'electronics', condition:'Like New', price:950,  rating:4.7, reviews:16, image:'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80' },
  { id:11, title:'JBL PartyBox 300 Speaker',          owner:'Kavya S.',   city:'Chennai',   category:'audio',       condition:'Good',     price:700,  rating:4.6, reviews:22, image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80' },
  { id:12, title:'Trek Mountain Bike 29"',            owner:'Arun M.',    city:'Pune',      category:'vehicles',    condition:'Good',     price:400,  rating:4.5, reviews:11, image:'https://images.unsplash.com/photo-1558543229-dcc9d00f7073?w=600&q=80' },
];

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
const CONDITION_COLORS: Record<string, string> = {
  'New':'bg-indigo-600 text-white',
  'Like New':'bg-indigo-50 text-indigo-700',
  'Good':'bg-amber-50 text-amber-700',
  'Fair':'bg-subtle text-muted',
};

// ── Listing Card ──────────────────────────────────────────────────
function ListingCard({ item, listView }: { item: MockListing; listView: boolean }) {
  return (
    <div className={`group bg-card rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 ${listView ? 'flex gap-0' : ''}`}>
      <div className={`relative overflow-hidden flex-shrink-0 ${listView ? 'w-52 h-40' : 'aspect-[4/3]'}`}>
        <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${CONDITION_COLORS[item.condition]}`}>
          {item.condition}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-faint uppercase tracking-widest mb-1">{item.category}</p>
        <h3 className="font-bold text-text leading-snug mb-2 line-clamp-2 group-hover:text-[#4F46E5] transition-colors">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted mb-auto">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.owner} · {item.city}</span>
        </div>
        <div className="flex items-end justify-between mt-4 pt-6 bg-subtle -mx-5 px-5 py-4 rounded-b-3xl">
          <div>
            <span className="text-2xl font-bold text-text">₹{item.price.toLocaleString()}</span>
            <span className="text-sm text-faint font-medium"> /day</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-text">{item.rating}</span>
            <span className="text-xs text-faint">({item.reviews})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────────
function FilterSidebar({ priceMax, condition, onPriceMaxChange, onConditionChange, onApply, onClear }:
  { priceMax:number; condition:string; onPriceMaxChange:(v:number)=>void; onConditionChange:(v:string)=>void; onApply:()=>void; onClear:()=>void; }) {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="bg-card rounded-3xl p-6 space-y-7 sticky top-24">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text">Filters</h3>
          <button onClick={onClear} className="text-xs font-semibold text-[#4F46E5] hover:underline">Clear all</button>
        </div>
        {/* Price */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-faint uppercase tracking-widest">Price per day</h4>
          <input type="range" min={0} max={10000} step={100} value={priceMax}
            onChange={e => onPriceMaxChange(Number(e.target.value))}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-sm font-semibold text-muted">
            <span>₹0</span><span>₹{priceMax.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-subtle rounded-full relative">
            <div className="absolute h-full bg-[#4F46E5] rounded-full" style={{left:'0%', right:`${100-(priceMax/10000)*100}%`}} />
          </div>
        </div>
        {/* Condition */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-faint uppercase tracking-widest">Condition</h4>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => onConditionChange(condition === c ? '' : c)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${condition===c ? 'bg-[#4F46E5] text-white' : 'bg-subtle text-muted hover:bg-subtle'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onApply}
          className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors">
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

// ── Main Content ──────────────────────────────────────────────────
function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── State — all URL param syncing preserved ───────────────────
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
    const parts: string[] = [];
    if (submitted) parts.push(`"${submitted}"`);
    if (category) parts.push(category.charAt(0).toUpperCase()+category.slice(1));
    document.title = parts.length > 0 ? `${parts.join(' · ')} | Browse | GoRentals` : 'Browse Gear | GoRentals';
  }, [submitted, category]);

  // ── Filtering + sorting on mock data ─────────────────────────
  const filtered = MOCK_LISTINGS.filter(item => {
    if (category && item.category !== category) return false;
    if (submitted && !item.title.toLowerCase().includes(submitted.toLowerCase())) return false;
    if (item.price > filtersApplied.priceMax) return false;
    if (filtersApplied.condition && item.condition !== filtersApplied.condition) return false;
    return true;
  }).sort((a,b) => {
    if (sort==='price_asc')  return a.price - b.price;
    if (sort==='price_desc') return b.price - a.price;
    if (sort==='rating')     return b.rating - a.rating;
    return b.id - a.id; // newest
  });

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(query); };
  const clearSearch = () => { setQuery(''); setSubmitted(''); };
  const applyFilters = () => { setFiltersApplied({ priceMax, condition }); setFilterSheetOpen(false); };
  const clearFilters = () => { setPriceMax(10000); setCondition(''); setFiltersApplied({ priceMax:10000, condition:'' }); };
  const activeFilterCount = [priceMax < 10000, condition !== ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-subtle pb-24">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="bg-card py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-faint uppercase tracking-widest mb-3">browse listings</p>
          <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight mb-3">Find the perfect gear</h1>
          <p className="text-muted text-lg mb-8">Discover top-rated items for rent in minutes.</p>

          {/* Search bar — No-Line: ambient shadow, no border */}
          <form onSubmit={handleSearch} className="max-w-3xl">
            <div className="flex gap-3 p-2.5 bg-subtle rounded-[24px] shadow-sm">
              <div className="relative flex-1 flex items-center">
                <SearchIcon className="absolute left-4 w-5 h-5 text-faint" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search cameras, laptops, drones..."
                  className="w-full h-12 pl-12 pr-10 bg-transparent text-text placeholder:text-faint text-base font-medium focus:outline-none" />
                {query && (
                  <button type="button" onClick={clearSearch} className="absolute right-3 text-faint hover:text-muted">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button type="submit" className="h-12 px-8 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[18px] text-sm font-bold transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Desktop Sidebar */}
          <FilterSidebar priceMax={priceMax} condition={condition}
            onPriceMaxChange={setPriceMax} onConditionChange={setCondition}
            onApply={applyFilters} onClear={clearFilters} />

          {/* Results column */}
          <div className="flex-1 min-w-0">

            {/* Category tabs */}
            <div className="relative mb-6">
              <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* All tab */}
                <button onClick={() => setCategory('')}
                  className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${!category ? 'bg-[#4F46E5] text-white shadow-sm' : 'bg-card text-muted hover:text-slate-800 hover:bg-card/80'}`}>
                  All
                </button>
                {CATEGORIES.map(c => {
                  const Icon = ICON_MAP[c.value] ?? Package;
                  return (
                    <button key={c.value} onClick={() => setCategory(c.value === category ? '' : c.value)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${category===c.value ? 'bg-[#4F46E5] text-white shadow-sm' : 'bg-card text-muted hover:text-slate-800'}`}>
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {hasOverflow && <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />}
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter */}
                <button onClick={() => setFilterSheetOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-card rounded-2xl text-sm font-semibold text-text hover:bg-subtle transition-colors">
                  <SlidersHorizontal className="w-4 h-4 text-[#4F46E5]" />
                  Filters
                  {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full">{activeFilterCount}</span>}
                </button>
                {/* Active chips */}
                {submitted && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-[#4F46E5] text-xs font-semibold rounded-xl">
                    &ldquo;{submitted}&rdquo;
                    <button onClick={clearSearch}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {category && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-[#4F46E5] text-xs font-semibold rounded-xl">
                    {category}
                    <button onClick={() => setCategory('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                    className="appearance-none h-9 pl-4 pr-9 bg-card rounded-2xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
                </div>
                {/* Grid/List toggle */}
                <div className="flex items-center gap-1 p-1 bg-card rounded-xl">
                  <button onClick={() => setViewMode('grid')} aria-label="Grid view"
                    className={`p-1.5 rounded-lg transition-colors ${viewMode==='grid' ? 'bg-[#4F46E5] text-white' : 'text-faint hover:text-text'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} aria-label="List view"
                    className={`p-1.5 rounded-lg transition-colors ${viewMode==='list' ? 'bg-[#4F46E5] text-white' : 'text-faint hover:text-text'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-faint font-medium mb-5">
              {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} found
            </p>

            {/* Results grid/list */}
            {filtered.length > 0 ? (
              <div className={viewMode==='grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'}>
                {filtered.map(item => <ListingCard key={item.id} item={item} listView={viewMode==='list'} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                  <SearchIcon className="w-10 h-10 text-[#4F46E5]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">No listings found</h3>
                <p className="text-muted mb-6 max-w-sm">Try adjusting your filters or search terms.</p>
                <button onClick={() => { clearSearch(); clearFilters(); setCategory(''); }}
                  className="h-11 px-8 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-colors">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text">Filters</h3>
              <button onClick={() => setFilterSheetOpen(false)} className="p-2 rounded-xl hover:bg-subtle">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="space-y-6 mb-8">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-faint uppercase tracking-widest">Max price / day</h4>
                <input type="range" min={0} max={10000} step={100} value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))} className="w-full accent-indigo-600" />
                <div className="flex justify-between text-sm font-semibold text-muted"><span>₹0</span><span>₹{priceMax.toLocaleString()}</span></div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-faint uppercase tracking-widest">Condition</h4>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c} onClick={() => setCondition(condition===c ? '' : c)}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${condition===c ? 'bg-[#4F46E5] text-white' : 'bg-subtle text-muted hover:bg-subtle'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={clearFilters} className="flex-1 py-3 bg-subtle hover:bg-slate-200 text-text font-semibold rounded-2xl text-sm transition-colors">Clear all</button>
              <button onClick={applyFilters} className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-2xl text-sm transition-colors">Apply Filters</button>
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
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-[#4F46E5] animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
