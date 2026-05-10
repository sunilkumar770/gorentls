'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Eye, 
  Edit3, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Package,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

const TABS = ['All', 'Active', 'Inactive', 'Pending Review'];

const MOCK_LISTINGS = [
  { id: 1, title: 'Sony A7 III Full-Frame Camera', category: 'Cameras', price: 1200, rating: 4.9, reviews: 34, bookings: 12, status: 'Active', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80' },
  { id: 2, title: 'DJI Mini 3 Pro Drone', category: 'Drones', price: 1800, rating: 4.7, reviews: 21, bookings: 8, status: 'Active', img: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=400&q=80' },
  { id: 3, title: 'Rode VideoMic Pro+', category: 'Audio', price: 450, rating: 4.8, reviews: 18, bookings: 5, status: 'Inactive', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80' },
  { id: 4, title: 'Canon EOS R5 with 24-70mm', category: 'Cameras', price: 2200, rating: 0, reviews: 0, bookings: 0, status: 'Pending Review', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80' },
];

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_LISTINGS.filter(l => {
    const matchesTab = activeTab === 'All' || l.status === activeTab;
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">My Listings</h1>
          <p className="text-muted mt-2">Manage your inventory and track performance.</p>
        </div>
        
        <Link href="/create-listing" className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5" /> Add New Listing
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest">Total Items</p>
            <p className="text-xl font-black text-text">12</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest">Active Now</p>
            <p className="text-xl font-black text-text">8</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest">Monthly Views</p>
            <p className="text-xl font-black text-text">2,450</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-card text-muted hover:bg-subtle'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings..."
            className="w-full h-11 pl-11 pr-4 bg-card rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none shadow-sm shadow-slate-100/50"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => (
          <div key={item.id} className="bg-card p-5 rounded-[2.5rem] shadow-sm shadow-slate-100/50 group hover:shadow-md transition-all duration-300">
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-subtle flex-shrink-0 relative">
                <img src={item.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  item.status === 'Active' ? 'bg-emerald-500 text-white' : 
                  item.status === 'Inactive' ? 'bg-subtle0 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {item.status}
                </div>
              </div>

              <div className="flex-1 py-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest">{item.category}</span>
                  <button className="text-slate-300 hover:text-muted"><MoreVertical className="w-4 h-4" /></button>
                </div>
                <h3 className="font-bold text-text group-hover:text-[#4F46E5] transition-colors mb-3 line-clamp-1">{item.title}</h3>
                
                <div className="flex items-center gap-4 text-xs font-bold text-faint mt-auto">
                  <div className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{item.bookings} bookings</div>
                  <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 border-none" />{item.rating || 'New'}</div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-text">₹{item.price.toLocaleString()}</span>
                    <span className="text-[10px] text-faint uppercase tracking-widest ml-1">/ day</span>
                  </div>
                  
                  {item.status === 'Active' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                      <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-card rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 pt-5 border-t-2 border-border">
              <button className="flex items-center justify-center gap-2 py-3 bg-subtle text-muted rounded-2xl text-xs font-bold hover:bg-subtle transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </button>
              <Link href={`/listings/${item.id}`} className="flex items-center justify-center gap-2 py-3 bg-indigo-50 text-[#4F46E5] rounded-2xl text-xs font-bold hover:bg-[#4F46E5] hover:text-white transition-all">
                <Eye className="w-3.5 h-3.5" /> View Public
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
