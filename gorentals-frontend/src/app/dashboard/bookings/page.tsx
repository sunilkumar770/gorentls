'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  MoreHorizontal,
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const TABS = ['All', 'Active', 'Upcoming', 'Completed', 'Cancelled'];

const MOCK_BOOKINGS = [
  { id: 'BK-9021', item: 'Sony A7 III Full-Frame Camera', owner: 'Rahul Sharma', location: 'Hyderabad', dates: 'Oct 12 - Oct 15', duration: '3 days', amount: '₹3,600', status: 'Active', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80' },
  { id: 'BK-8842', item: 'DJI Mini 3 Pro Drone', owner: 'Rahul Sharma', location: 'Hyderabad', dates: 'Oct 20 - Oct 22', duration: '2 days', amount: '₹3,600', status: 'Upcoming', img: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=300&q=80' },
  { id: 'BK-7710', item: 'Apple MacBook Pro M2', owner: 'Priya Kapoor', location: 'Bengaluru', dates: 'Sep 28 - Oct 01', duration: '3 days', amount: '₹7,500', status: 'Completed', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&q=80' },
  { id: 'BK-6621', item: 'Rode VideoMic Pro+', owner: 'Aarav Mehta', location: 'Mumbai', dates: 'Sep 15 - Sep 17', duration: '2 days', amount: '₹900', status: 'Cancelled', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&q=80' },
];

const STATUS_THEMES: Record<string, any> = {
  Active: { bg: 'bg-indigo-50', text: 'text-[#4F46E5]', icon: Clock },
  Upcoming: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Calendar },
  Completed: { bg: 'bg-subtle', text: 'text-muted', icon: CheckCircle2 },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertCircle },
};

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_BOOKINGS.filter(b => {
    const matchesTab = activeTab === 'All' || b.status === activeTab;
    const matchesSearch = b.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text tracking-tight">My Bookings</h1>
          <p className="text-muted mt-2">Manage your active rentals and booking history.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or item..."
              className="w-full h-11 pl-11 pr-4 bg-card rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all border-none shadow-sm shadow-slate-100/50"
            />
          </div>
          <button className="w-11 h-11 bg-card rounded-2xl flex items-center justify-center text-muted shadow-sm shadow-slate-100/50 hover:bg-subtle transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all flex-shrink-0 ${
              activeTab === tab 
                ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-200' 
                : 'bg-card text-muted hover:bg-subtle'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((booking) => {
            const theme = STATUS_THEMES[booking.status];
            return (
              <div key={booking.id} className="bg-card p-6 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex flex-col md:flex-row items-start md:items-center gap-6 group hover:shadow-md transition-all duration-300">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-subtle flex-shrink-0">
                  <img src={booking.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-faint uppercase tracking-[0.2em]">{booking.id}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${theme.bg} ${theme.text}`}>
                      <theme.icon className="w-3 h-3" />
                      {booking.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text group-hover:text-[#4F46E5] transition-colors line-clamp-1">{booking.item}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{booking.owner}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{booking.location}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{booking.dates} ({booking.duration})</span>
                  </div>
                </div>

                {/* Amount & Action */}
                <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-4 md:border-l-2 md:border-border md:pl-8">
                  <div className="text-left md:text-right">
                    <p className="text-xs font-bold text-faint uppercase tracking-widest mb-0.5">Amount Paid</p>
                    <p className="text-xl font-black text-text">{booking.amount}</p>
                  </div>
                  <Link href={`/dashboard/bookings/${booking.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-subtle hover:bg-[#4F46E5] hover:text-white text-text rounded-2xl text-xs font-bold transition-all">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card rounded-[2.5rem] py-24 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 bg-subtle rounded-3xl flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-slate-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No bookings found</h3>
            <p className="text-muted max-w-sm">Try adjusting your filters or search query to find what you&apos;re looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
