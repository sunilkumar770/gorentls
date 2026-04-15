'use client';

import { useState } from 'react';
import { useListings } from '@/hooks/useListings';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import ListingGrid from '@/components/listing/ListingGrid';
import { CATEGORIES } from '@/constants';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10">
        
        {/* Search Header: Semantic & Editorial */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-[#251913]">
            The <span className="text-[#f97316]">Archive</span> Search
          </h1>
          <p className="text-[#8c7164] font-medium tracking-tight text-lg">Curated artifacts, verified for quality and performance.</p>
        </div>

        {/* Filter Bar: Artifact Style */}
        <div className="bg-white p-3 rounded-[2rem] shadow-ambient ring-1 ring-[#f97316]/5 flex flex-col lg:flex-row gap-3 items-center">
          <form onSubmit={handleSearch} className="w-full flex-1 relative group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#f97316] h-5 w-5 transition-transform group-focus-within:scale-110" />
            <input 
              placeholder="Search for imaging gear, tools, expedition equipment..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#fff8f6] rounded-[1.5rem] outline-none text-[#251913] font-display font-bold text-lg placeholder-[#8c7164]/40 focus:ring-2 focus:ring-[#f97316] transition-all border-none"
            />
          </form>

          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
            <div className="relative group">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full lg:w-56 bg-[#fff8f6] border-none text-[#251913] font-display font-black text-sm rounded-[1.25rem] pl-5 pr-10 py-4 outline-none focus:ring-2 focus:ring-[#f97316] appearance-none cursor-pointer transition-all"
              >
                <option value="">All Collections</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#f97316]">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            </div>

            <div className="relative group">
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as any)}
                className="w-full lg:w-56 bg-[#fff8f6] border-none text-[#251913] font-display font-black text-sm rounded-[1.25rem] pl-5 pr-10 py-4 outline-none focus:ring-2 focus:ring-[#f97316] appearance-none cursor-pointer transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#f97316]">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-4">
          <ListingGrid filters={{ query: searchQuery, category: category || undefined, sort }} />
        </div>
      </div>
    </div>
  );
}
