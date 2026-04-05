'use client';

import { useState, useEffect } from 'react';
import { adminService, AdminStats } from '@/services/admin';
import { Shield, Users, Package, TrendingUp, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { KYCManagement } from '@/components/admin/KYCManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'listings'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f97316]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f97316] rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-display font-black tracking-tighter text-[#251913]">
                Control <span className="text-[#f97316]">Center</span>
              </h1>
            </div>
            <p className="text-[#8c7164] font-medium text-lg">System-wide oversight & identity verification.</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm ring-1 ring-[#f97316]/5">
            {(['overview', 'kyc', 'listings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                  activeTab === tab 
                  ? 'bg-[#f97316] text-white shadow-md' 
                  : 'text-[#8c7164] hover:text-[#251913]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Total Revenue" 
                value={formatCurrency(stats.totalRevenue)} 
                icon={<TrendingUp className="h-5 w-5" />}
                subtext={`Commission: ${formatCurrency(stats.platformCommission)}`}
              />
              <StatCard 
                label="Platform Users" 
                value={stats.totalUsers.toString()} 
                icon={<Users className="h-5 w-5" />}
                subtext={`${stats.totalOwners} Owners / ${stats.totalRenters} Renters`}
              />
              <StatCard 
                label="Active Listings" 
                value={stats.activeListings.toString()} 
                icon={<Package className="h-5 w-5" />}
                subtext={`${stats.pendingListings} Pending Approval`}
              />
              <StatCard 
                label="Pending KYC" 
                value={stats.pendingKYC.toString()} 
                icon={<Clock className="h-5 w-5" />}
                color="orange"
                subtext="Requires Immediate Review"
              />
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 bg-white border-none shadow-ambient rounded-[2rem]">
                <h3 className="font-display text-2xl font-black text-[#251913] mb-6">System Health</h3>
                <div className="space-y-4">
                  <HealthItem label="Database Connectivity" status="operational" />
                  <HealthItem label="Asset Storage (S3)" status="operational" />
                  <HealthItem label="Payment Gateway (Razorpay)" status="operational" />
                </div>
              </Card>
              
              <Card className="p-8 bg-[#251913] border-none shadow-ambient rounded-[2rem] text-white">
                <h3 className="font-display text-2xl font-black mb-6">Admin Summary</h3>
                <p className="text-white/60 font-medium mb-6">Currently tracking {stats.activeBookings} active rentals across the platform.</p>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl">
                  Export Monthly Report
                </Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && <KYCManagement />}
        
        {activeTab === 'listings' && (
          <div className="bg-white p-12 rounded-[3rem] shadow-ambient text-center">
            <Package className="h-16 w-16 text-[#f97316]/20 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#251913]">Listing Moderation</h2>
            <p className="text-[#8c7164] font-medium mt-2">Inventory review flow is under construction.</p>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtext, color = 'brown' }: { label: string; value: string; icon: React.ReactNode; subtext: string; color?: 'orange' | 'brown' }) {
  const iconBg = color === 'orange' ? 'bg-[#f97316]/10 text-[#f97316]' : 'bg-[#251913]/5 text-[#251913]';
  return (
    <Card className="p-6 bg-white border-none shadow-ambient rounded-[1.75rem] transition-transform hover:-translate-y-1">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-[#8c7164]">{label}</span>
      </div>
      <div className="text-3xl font-display font-black text-[#251913]">{value}</div>
      <div className="mt-2 text-[10px] font-bold text-[#8c7164] uppercase tracking-tight">{subtext}</div>
    </Card>
  );
}

function HealthItem({ label, status }: { label: string; status: 'operational' | 'degraded' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#fff8f6] last:border-0">
      <span className="font-bold text-[#251913]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{status}</span>
      </div>
    </div>
  );
}
