'use client';

import { KPICard } from './KPICard';
import { RevenueChart, RevenuePoint } from './RevenueChart';
import { RecentBookingsTable, RecentBooking } from './RecentBookingsTable';
import { TrendingUp, Wallet, ShoppingBag, CheckCircle, Package, Clock, XCircle, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  pendingRevenue: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  rejectedBookings: number;
  completionRate: number;
  activeListings: number;
  totalListings: number;
  averageBookingValue: number;
  recentBookings: RecentBooking[];
  revenueChart: RevenuePoint[];
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Owner Analytics</h1>
        <p className="text-slate-400">Track your asset performance and earnings trends.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={`₹${data.totalRevenue.toLocaleString('en-IN')}`} 
          icon={<Wallet className="w-5 h-5 text-emerald-400" />}
          trend="+14.2%" 
          trendUp={true}
        />
        <KPICard 
          title="Completion Rate" 
          value={`${data.completionRate.toFixed(1)}%`} 
          icon={<CheckCircle className="w-5 h-5 text-teal-400" />}
          trend="-2.1%"
          trendUp={false}
        />
        <KPICard 
          title="Total Bookings" 
          value={data.totalBookings} 
          icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
        />
        <KPICard 
          title="Active Listings" 
          value={`${data.activeListings} / ${data.totalListings}`} 
          icon={<Package className="w-5 h-5 text-amber-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RevenueChart data={data.revenueChart} className="lg:col-span-2 shadow-xl shadow-emerald-500/5" />
        <RecentBookingsTable bookings={data.recentBookings} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pending Orders</p>
            <h4 className="text-xl font-bold text-white">{data.pendingBookings}</h4>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <XCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Rejected / Cancelled</p>
            <h4 className="text-xl font-bold text-white">{data.rejectedBookings}</h4>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Avg. Booking Value</p>
            <h4 className="text-xl font-bold text-white">₹{data.averageBookingValue.toLocaleString('en-IN')}</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
