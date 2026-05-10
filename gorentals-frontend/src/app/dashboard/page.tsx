'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Calendar,
  Wallet,
  Zap,
  TrendingUp
} from 'lucide-react';

const MOCK_STATS = [
  { label: 'Active Rentals', value: '3', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Upcoming', value: '1', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Completed', value: '12', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Spent', value: '₹14,500', icon: Wallet, color: 'text-muted', bg: 'bg-subtle' },
];

const RECENT_BOOKINGS = [
  { id: 1, item: 'Sony A7 III Camera', date: 'Oct 12 - Oct 15', status: 'Active', price: '₹3,600', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80' },
  { id: 2, item: 'DJI Mini 3 Pro', date: 'Oct 20 - Oct 22', status: 'Upcoming', price: '₹3,600', img: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=200&q=80' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [userRole] = useState<'RENTER' | 'OWNER'>('RENTER');

  useEffect(() => {
    if (userRole === 'OWNER') {
      router.push('/dashboard/analytics');
    }
  }, [userRole, router]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-text tracking-tight">Welcome back, John! 👋</h1>
        <p className="text-muted mt-2">Here&apos;s what&apos;s happening with your rentals today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat) => (
          <div key={stat.label} className="bg-card p-6 rounded-[2.5rem] shadow-sm shadow-slate-100/50 flex items-center gap-5 group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-faint uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-text mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Recent Activity</h2>
            <Link href="/dashboard/bookings" className="text-sm font-bold text-[#4F46E5] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {RECENT_BOOKINGS.map((booking) => (
              <div key={booking.id} className="bg-card p-5 rounded-3xl flex items-center gap-5 group hover:shadow-sm transition-all border-2 border-transparent hover:border-indigo-50">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-subtle flex-shrink-0">
                  <img src={booking.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text">{booking.item}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-muted">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{booking.date}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="font-bold text-text">{booking.price}</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                  booking.status === 'Active' ? 'bg-indigo-50 text-[#4F46E5]' : 'bg-amber-50 text-amber-700'
                }`}>
                  {booking.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text">Quick Actions</h2>
          <div className="bg-[#4F46E5] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Become an Owner</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">List your gear and start earning up to ₹25,000/month in passive income.</p>
              <Link href="/create-listing" className="inline-flex items-center gap-2 px-6 py-3 bg-card text-[#4F46E5] rounded-2xl text-sm font-bold hover:bg-indigo-50 transition-colors">
                List Now <Zap className="w-4 h-4 fill-[#4F46E5]" />
              </Link>
            </div>
            <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-400/20 rotate-12 transition-transform group-hover:scale-110" />
          </div>

          <div className="bg-card rounded-[2.5rem] p-8 shadow-sm shadow-slate-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-text">Rental Tip</h3>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Always record a 30-second video of the item during pickup and return to ensure easy damage claim processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
