'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { adminService, type AdminStats } from '@/services/admin';
import { 
  Users, 
  Store, 
  UserCircle, 
  Package, 
  Clock, 
  CalendarCheck, 
  CheckCircle, 
  IndianRupee, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        setStats(data);
      } catch (error: any) {
        toast.error('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && profile?.userType === 'ADMIN') {
      fetchStats();
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [authLoading, profile?.userType]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-8 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-1/3 bg-gray-200 rounded-lg mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-sm" />)}
          </div>
          <div className="h-6 w-1/4 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-2xl shadow-sm" />)}
          </div>
        </div>
      </div>
    );
  }

  if (profile?.userType !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">You need administrator privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-[#111827]">
            <span className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center text-white text-sm font-black">A</span>
            Admin Portal
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
              System Administrator
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827]">
            {greeting}, {profile?.fullName?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-[#6b7280] mt-1 text-sm">
            Here's what's happening across the GoRentals platform today.
          </p>
        </div>

        {/* Top KPIs: Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#111827] to-[#374151] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-300 font-medium mb-1">Total Platform Revenue</p>
              <h2 className="text-4xl font-black mb-4">
                {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : '₹0'}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Live Tracker
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <IndianRupee className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-purple-100 font-medium mb-1">Total Platform Commission</p>
              <h2 className="text-4xl font-black mb-4">
                {stats?.platformCommission ? formatCurrency(stats.platformCommission) : '₹0'}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                Earnings applied on completion
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Users Segment */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Users</h3>
            <div className="grid grid-cols-2 gap-4">
               <StatCard 
                icon={Users} 
                label="Total Users" 
                value={stats?.totalUsers || 0} 
                color="blue" 
              />
              <StatCard 
                icon={Store} 
                label="Store Owners" 
                value={stats?.totalOwners || 0} 
                color="indigo" 
              />
              <StatCard 
                icon={UserCircle} 
                label="Renters Only" 
                value={stats?.totalRenters || 0} 
                color="cyan" 
              />
              <StatCard 
                icon={AlertCircle} 
                label="Pending KYC" 
                value={stats?.pendingOwnerVerifications || 0} 
                color="amber" 
                highlight={!!stats?.pendingOwnerVerifications}
              />
            </div>
          </div>

          {/* Listings Segment */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                icon={Package} 
                label="Total Listings" 
                value={stats?.totalListings || 0} 
                color="violet" 
              />
              <StatCard 
                icon={CheckCircle} 
                label="Active Listings" 
                value={stats?.activeListings || 0} 
                color="emerald" 
              />
              <StatCard 
                icon={AlertCircle} 
                label="Pending Approvals" 
                value={stats?.pendingListings || 0} 
                color="amber" 
                highlight={!!stats?.pendingListings}
              />
            </div>
          </div>

          {/* Bookings Segment */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Transactions</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                icon={CalendarCheck} 
                label="Total Bookings" 
                value={stats?.totalBookings || 0} 
                color="rose" 
              />
              <StatCard 
                icon={Clock} 
                label="Active Now" 
                value={stats?.activeBookings || 0} 
                color="sky" 
              />
              <StatCard 
                icon={CheckCircle} 
                label="Completed" 
                value={stats?.completedBookings || 0} 
                color="green" 
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  highlight 
}: { 
  icon: any, 
  label: string, 
  value: number | string, 
  color: 'blue' | 'indigo' | 'cyan' | 'amber' | 'violet' | 'emerald' | 'rose' | 'sky' | 'green',
  highlight?: boolean
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:border-blue-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:border-indigo-200' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:border-cyan-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:border-amber-200' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:border-violet-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:border-emerald-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:border-rose-200' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', hover: 'hover:border-sky-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:border-green-200' },
  };

  const theme = colorMap[color];

  return (
    <div className={`bg-white p-5 rounded-2xl border ${highlight ? 'border-amber-300 ring-4 ring-amber-50' : 'border-[#e5e7eb]'} transition-all hover:shadow-md ${theme.hover} relative cursor-default`}>
      {highlight && (
        <span className="flex h-3 w-3 absolute -top-1 -right-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.bg}`}>
        <Icon className={`w-5 h-5 ${theme.text}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
