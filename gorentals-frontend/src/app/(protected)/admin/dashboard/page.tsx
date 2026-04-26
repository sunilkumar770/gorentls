'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  LayoutDashboard, Users, Store, Package, CalendarCheck,
  TrendingUp, IndianRupee, RefreshCw, Search, ChevronDown,
  CheckCircle2, XCircle, Ban, Eye, Loader2, AlertCircle,
} from 'lucide-react';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { toast } from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers:    number;
  totalOwners:   number;
  totalListings: number;
  totalBookings: number;
  totalRevenue:  number;
  pendingKYC:    number; // Aligned with backend
  activeListings?: number;
  pendingBookings?: number;
}
interface AdminUser {
  id:         string;
  name:       string;
  fullName?:  string;
  email:      string;
  userType:   string;
  role?:      string;
  kycStatus?: string;
  isVerified?: boolean;
  createdAt?: string;
  phone?:     string;
}
interface AdminListing {
  id:            string;
  title:         string;
  price_per_day: number;
  is_available:  boolean;
  is_published:  boolean;
  city?:         string;
  category?:     string;
  owner?:        { name?: string; fullName?: string; email?: string };
  createdAt?:    string;
}

const mapAdminListing = (l: any): AdminListing => ({
  id:            l.id,
  title:         l.title,
  price_per_day: l.price_per_day ?? l.pricePerDay ?? 0,
  is_available:  l.is_available  ?? l.isAvailable  ?? false,
  is_published:  l.is_published  ?? l.isPublished  ?? false,
  city:          l.city,
  category:      l.category,
  owner:         l.owner,
  createdAt:     l.createdAt
});
interface AdminBooking {
  id:         string;
  status:     string;
  totalPrice: number;
  startDate:  string;
  endDate:    string;
  renter?:    { name?: string; fullName?: string; email?: string };
  listing?:   { title?: string };
  createdAt?: string;
}

type TabId = 'overview' | 'users' | 'owners' | 'listings' | 'bookings';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',  icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'users',    label: 'Users',     icon: <Users           className="w-4 h-4" /> },
  { id: 'owners',   label: 'Owners',    icon: <Store           className="w-4 h-4" /> },
  { id: 'listings', label: 'Assets',    icon: <Package         className="w-4 h-4" /> },
  { id: 'bookings', label: 'Bookings',  icon: <CalendarCheck   className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [listings,  setListings]  = useState<AdminListing[]>([]);
  const [bookings,  setBookings]  = useState<AdminBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search,    setSearch]    = useState('');
  const [listingFilter, setListingFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  const [busy,      setBusy]      = useState<Set<string>>(new Set());

  // Redirect non-admins and unauthenticated users
  useEffect(() => {
    console.log(`[AdminDashboard] State - loading: ${loading}, isAuthenticated: ${isAuthenticated}, isAdmin: ${isAdmin}`);
    if (!loading) {
      if (!isAuthenticated) {
        console.warn('[AdminDashboard] Not authenticated. Redirecting to login.');
        router.replace('/login?redirect=/admin/dashboard');
        return;
      }
      if (!isAdmin) {
        console.warn('[AdminDashboard] Not an admin. Redirecting to home.');
        router.replace('/');
        return;
      }
      console.log('[AdminDashboard] Access granted.');
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  // Load data for current tab
  const loadTab = useCallback(async (tab: TabId) => {
    setLoadingData(true);
    try {
      switch (tab) {
        case 'overview': {
          const res = await api.get<DashboardStats>('/admin/dashboard/stats');
          setStats(res.data);
          break;
        }
        case 'users':
        case 'owners': {
          const res = await api.get<{ content: AdminUser[] }>('/admin/users');
          setUsers(Array.isArray(res.data.content) ? res.data.content : []);
          break;
        }
        case 'listings': {
          const res = await api.get<{ content: any[] }>('/admin/listings');
          const mapped = (res.data.content || []).map(mapAdminListing);
          setListings(mapped);
          break;
        }
        case 'bookings': {
          const res = await api.get<{ content: AdminBooking[] }>('/admin/bookings');
          setBookings(Array.isArray(res.data.content) ? res.data.content : []);
          break;
        }
      }
    } catch (err: any) {
      toast.error(`Failed to load ${tab}: ${err?.response?.data?.message ?? err.message}`);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { if (!loading && isAdmin) loadTab(activeTab); }, [activeTab, isAdmin, loadTab, loading]);
  useEffect(() => { if (!loading && isAdmin) loadTab('overview'); }, [isAdmin, loading, loadTab]); 

  // ── Admin actions ────────────────────────────────────────────────────────────
  async function toggleListingActive(id: string, isPublished: boolean) {
    setBusy(p => new Set(p).add(id));
    try {
      if (isPublished) {
        // Reject/Deactivate
        await api.delete(`/admin/listings/${id}/reject`);
        setListings(p => p.map(l => l.id === id ? { ...l, is_published: false, is_available: false } : l));
        toast.success('Listing deactivated.');
      } else {
        // Approve/Publish
        await api.patch(`/admin/listings/${id}/approve`);
        setListings(p => p.map(l => l.id === id ? { ...l, is_published: true, is_available: true } : l));
        toast.success('Listing approved and live.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update listing.');
    } finally {
      setBusy(p => { const s = new Set(p); s.delete(id); return s; });
    }
  }

  async function approveKyc(userId: string) {
    setBusy(p => new Set(p).add(userId));
    try {
      await api.patch(`/admin/users/${userId}/verify`);
      setUsers(p => p.map(u => u.id === userId ? { ...u, kycStatus: 'APPROVED', isVerified: true } : u));
      toast.success('KYC approved.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve KYC.');
    } finally {
      setBusy(p => { const s = new Set(p); s.delete(userId); return s; });
    }
  }

  async function rejectKyc(userId: string) {
    setBusy(p => new Set(p).add(userId + '_r'));
    try {
      await api.patch(`/admin/users/${userId}/suspend`);
      setUsers(p => p.map(u => u.id === userId ? { ...u, kycStatus: 'REJECTED' } : u));
      toast.success('KYC rejected (User suspended).');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject KYC.');
    } finally {
      setBusy(p => { const s = new Set(p); s.delete(userId + '_r'); return s; });
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const q = search.toLowerCase();

  const filteredUsers = users.filter(u => {
    const role = (u.userType ?? u.role ?? '').toUpperCase();
    if (activeTab === 'owners' && role !== 'OWNER') return false;
    if (!q) return true;
    return (u.name ?? u.fullName ?? '').toLowerCase().includes(q)
        || (u.email ?? '').toLowerCase().includes(q);
  });

  const filteredListings = listings.filter(l => {
    if (listingFilter === 'PENDING') return !l.is_published;
    if (listingFilter === 'ACTIVE')  return l.is_published && l.is_available;
    return true;
  }).filter(l => !q
    || (l.title ?? '').toLowerCase().includes(q)
    || (l.city  ?? '').toLowerCase().includes(q)
    || ((l.owner?.name ?? l.owner?.fullName ?? '').toLowerCase().includes(q)));

  const filteredBookings = bookings.filter(b =>
    !q
    || (b.status ?? '').toLowerCase().includes(q)
    || (b.listing?.title  ?? '').toLowerCase().includes(q)
    || (b.renter?.name ?? b.renter?.fullName ?? '').toLowerCase().includes(q),
  );

  // loading state for auth hydration
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-medium animate-pulse">Synchronizing secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin mb-4" />
        <p className="text-[var(--text-muted)] font-medium animate-pulse">Redirecting to secure portal...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-display font-bold text-[var(--text)] tracking-tight">Admin Control Center</h1>
            <button onClick={() => loadTab(activeTab)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]
                               hover:text-[var(--text)] transition-colors px-3 py-1.5 rounded-[var(--r-md)] border border-transparent hover:border-[var(--border)] font-bold uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          {/* Tab Bar */}
          <nav className="flex gap-2 -mb-px overflow-x-auto scrollbar-hide py-1">
            {TABS.map(tab => (
              <button key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold
                                  border-b-2 whitespace-nowrap transition-colors rounded-t-[var(--r-md)]
                                  ${activeTab === tab.id
                                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'}`}>
                {tab.icon}
                {tab.label}
                {/* Badges */}
                {tab.id === 'users' && users.length > 0 && (
                  <span className="text-[10px] font-black bg-[var(--bg-subtle)] text-[var(--text)] rounded-full px-2 py-0.5">
                    {users.filter(u => (u.userType ?? u.role ?? '').toUpperCase() === 'RENTER').length}
                  </span>
                )}
                {tab.id === 'owners' && users.length > 0 && (
                  <span className="text-[10px] font-black bg-[var(--bg-subtle)] text-[var(--text)] rounded-full px-2 py-0.5">
                    {users.filter(u => (u.userType ?? u.role ?? '').toUpperCase() === 'OWNER').length}
                  </span>
                )}
                {tab.id === 'listings' && (
                  <span className="text-[10px] font-black bg-yellow-500/10 text-yellow-600 rounded-full px-2 py-0.5">
                    {listings.filter(l => !l.is_published).length || ''}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && activeTab !== 'overview' ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TAB: Overview ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] p-6 animate-pulse">
                        <div className="h-3 bg-[var(--bg)] rounded w-1/2 mb-4" />
                        <div className="h-8 bg-[var(--bg)] rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <StatCard icon={<Users className="w-5 h-5 text-[var(--text-muted)]" />}
                                label="Total Users"    value={stats.totalUsers}    />
                      <StatCard icon={<Store className="w-5 h-5 text-[var(--text-muted)]" />}
                                label="Vendors"        value={stats.totalOwners}   />
                      <StatCard icon={<Package className="w-5 h-5 text-[var(--text-muted)]" />}
                                label="Assets"         value={stats.totalListings}  />
                      <StatCard icon={<CalendarCheck className="w-5 h-5 text-[var(--text-muted)]" />}
                                label="Bookings"       value={stats.totalBookings}  />
                      <StatCard icon={<IndianRupee className="w-5 h-5 text-[var(--text-muted)]" />}
                                label="GMV"            value={`₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} />
                      <StatCard icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
                                label="Pending KYC"    value={stats.pendingKYC}    accent />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {[
                        { label: 'Review KYC Applications', tab: 'users'    as TabId, count: stats.pendingKYC,    color: 'text-amber-700 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' },
                        { label: 'Pending Asset Approval',  tab: 'listings' as TabId, count: listings.filter(l => !l.is_published).length, color: 'text-orange-700 bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40' },
                        { label: 'Recent Transactions',     tab: 'bookings' as TabId, count: stats.totalBookings,  color: 'text-[var(--text)] bg-[var(--bg-subtle)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]' },
                      ].map(a => (
                        <button key={a.tab}
                                onClick={() => setActiveTab(a.tab)}
                                className={`flex items-center justify-between p-6 rounded-[var(--r-xl)] border
                                            text-left shadow-sm transition-all ${a.color}`}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{a.label}</p>
                            <p className="text-3xl font-display font-bold">{a.count}</p>
                          </div>
                          <ChevronDown className="w-6 h-6 rotate-[-90deg] opacity-60" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <ErrorState onRetry={() => loadTab('overview')} />
                )}
              </div>
            )}

            {/* ── TAB: Users & Owners ────────────────────────────────────── */}
            {(activeTab === 'users' || activeTab === 'owners') && (
              <div>
                <SearchBar value={search} onChange={setSearch}
                           placeholder={activeTab === 'owners'
                             ? 'Query vendors by identity…'
                             : 'Query users by identity…'} />
                <p className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mb-4">
                  {filteredUsers.length} matched records
                </p>
                <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Identity</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Email Record</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Access Tier</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Compliance</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Enforcement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-16 text-[var(--text-faint)] font-bold">No records found</td></tr>
                        ) : filteredUsers.map(u => {
                          const role = (u.userType ?? u.role ?? '').toUpperCase();
                          const kyc  = u.kycStatus ?? 'PENDING';
                          const name = u.name ?? u.fullName ?? '—';
                          return (
                            <tr key={u.id} className="hover:bg-[var(--bg)] transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center
                                                  justify-center text-xs font-bold text-[var(--text)] flex-shrink-0">
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-[var(--text)]">{name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-[var(--text-muted)] font-medium">{u.email}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase
                                  ${role === 'OWNER'       ? 'bg-purple-500/10 text-purple-600' :
                                    role === 'ADMIN' || role === 'SUPER_ADMIN'
                                                           ? 'bg-red-500/10 text-red-600'
                                                           : 'bg-blue-500/10 text-blue-600'}`}>
                                  {role}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase
                                  ${kyc === 'APPROVED' ? 'bg-green-500/10 text-green-600' :
                                    kyc === 'REJECTED'  ? 'bg-red-500/10 text-red-600'
                                                        : 'bg-yellow-500/10 text-yellow-600'}`}>
                                  {kyc}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {kyc === 'PENDING' && (
                                  <div className="flex items-center gap-2">
                                    <ActionBtn
                                      onClick={() => approveKyc(u.id)}
                                      loading={busy.has(u.id)}
                                      icon={<CheckCircle2 className="w-4 h-4" />}
                                      label="" variant="green" title="Approve KYC" />
                                    <ActionBtn
                                      onClick={() => rejectKyc(u.id)}
                                      loading={busy.has(u.id + '_r')}
                                      icon={<XCircle className="w-4 h-4" />}
                                      label="" variant="red" title="Reject KYC" />
                                  </div>
                                )}
                                {kyc === 'APPROVED' && (
                                  <span className="text-[10px] font-bold text-[var(--text-faint)] tracking-wider uppercase flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Cleared
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Listings ──────────────────────────────────────────── */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex gap-4 mb-4 flex-wrap items-center">
                  <SearchBar value={search} onChange={setSearch} placeholder="Search asset registry…" />
                  <div className="flex gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1.5">
                    {(['ALL', 'ACTIVE', 'PENDING'] as const).map(f => (
                      <button key={f}
                              onClick={() => setListingFilter(f)}
                              className={`px-3.5 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-colors
                                ${listingFilter === f
                                  ? 'bg-[var(--text)] text-[var(--bg)]'
                                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                        {f}
                        {f === 'PENDING' && listings.filter(l => !l.is_published).length > 0 && (
                          <span className={`${listingFilter === f ? 'bg-[var(--bg)]/20' : 'bg-[var(--border)]'} ml-2 rounded-full px-1.5`}>
                            {listings.filter(l => !l.is_published).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mb-4">
                  {filteredListings.length} registered assets
                </p>
                <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Nomenclature</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Vendor</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Zone</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Yield/Day</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">State</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredListings.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-16 text-[var(--text-faint)] font-bold">No assets found</td></tr>
                        ) : filteredListings.map(l => (
                          <tr key={l.id} className="hover:bg-[var(--bg)] transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-bold text-[var(--text)] truncate max-w-[200px]">{l.title}</p>
                              <p className="text-xs font-semibold text-[var(--text-muted)] capitalize">{l.category}</p>
                            </td>
                            <td className="px-5 py-4 text-[var(--text-muted)] font-medium text-xs">
                              {l.owner?.name ?? l.owner?.fullName ?? l.owner?.email ?? '—'}
                            </td>
                            <td className="px-5 py-4 text-[var(--text-muted)] font-medium">{l.city ?? '—'}</td>
                            <td className="px-5 py-4 font-bold text-[var(--text)] tabular-nums">
                              ₹{(l.price_per_day ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase
                                ${l.is_published && l.is_available ? 'bg-green-500/10 text-green-600' :
                                  l.is_published                  ? 'bg-yellow-500/10 text-yellow-600'
                                                                 : 'bg-red-500/10 text-red-600'}`}>
                                {l.is_published && l.is_available ? 'Active' :
                                 l.is_published                  ? 'Blocked' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <ActionBtn
                                onClick={() => toggleListingActive(l.id, l.is_published)}
                                loading={busy.has(l.id)}
                                icon={l.is_published
                                  ? <Ban className="w-4 h-4" />
                                  : <CheckCircle2 className="w-4 h-4" />}
                                label={l.is_published ? 'Halt' : 'Publish'}
                                variant={l.is_published ? 'red' : 'green'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Bookings ──────────────────────────────────────────── */}
            {activeTab === 'bookings' && (
              <div>
                <SearchBar value={search} onChange={setSearch}
                           placeholder="Filter operations..." />
                <p className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mb-4">
                  {filteredBookings.length} operations logged
                </p>
                <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Asset Reference</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Client</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Duration</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Yield</th>
                          <th className="text-left px-5 py-4 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {filteredBookings.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-16 text-[var(--text-faint)] font-bold">No operations logged</td></tr>
                        ) : filteredBookings.map(b => (
                          <tr key={b.id} className="hover:bg-[var(--bg)] transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-bold text-[var(--text)] truncate max-w-[200px]">
                                {b.listing?.title ?? '—'}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-[var(--text-muted)] font-medium text-xs">
                              {b.renter?.name ?? b.renter?.fullName ?? b.renter?.email ?? '—'}
                            </td>
                            <td className="px-5 py-4 text-[var(--text-muted)] font-medium text-xs tabular-nums">
                              {b.startDate ?? '—'} <span className="opacity-50">→</span> {b.endDate ?? '—'}
                            </td>
                            <td className="px-5 py-4 font-bold text-[var(--text)] tabular-nums">
                              ₹{(b.totalPrice ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-5 py-4">
                              <BookingStatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = false }: {
  icon:    React.ReactNode;
  label:   string;
  value:   string | number;
  accent?: boolean;
}) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-[var(--r-xl)] border shadow-sm p-6
                     ${accent ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[var(--border)]'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-display font-bold tabular-nums tracking-tight
                     ${accent ? 'text-yellow-600' : 'text-[var(--text)]'}`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)] pointer-events-none" />
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-[var(--r-md)] text-sm font-medium bg-[var(--bg-card)] text-[var(--text)] placeholder:text-[var(--text-faint)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
      />
    </div>
  );
}

function ActionBtn({ onClick, loading, icon, label, variant, title }: {
  onClick:  () => void;
  loading:  boolean;
  icon:     React.ReactNode;
  label:    string;
  title?:   string;
  variant:  'green' | 'red' | 'blue';
}) {
  const colors = {
    green: 'bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20',
    red:   'bg-red-500/10 text-red-700 hover:bg-red-500/20 border-red-500/20',
    blue:  'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20',
  };
  return (
    <button onClick={onClick} disabled={loading} title={title}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border
                        transition-colors disabled:opacity-50 ${colors[variant]}`}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-20 bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] shadow-card">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <p className="text-[var(--text)] font-bold text-lg mb-2">System Interruption</p>
      <p className="text-[var(--text-muted)] font-medium mb-6">Failed to sync secure telemetry stream.</p>
      <button onClick={onRetry}
              className="px-6 py-3 bg-[var(--text)] text-[var(--bg)] text-sm font-bold
                         rounded-[var(--r-md)] hover:bg-black transition-all shadow-sm">
        Re-establish Connection
      </button>
    </div>
  );
}
