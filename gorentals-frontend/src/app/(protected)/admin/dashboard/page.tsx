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
  id:          string;
  title:       string;
  pricePerDay: number;
  isAvailable: boolean;
  isPublished: boolean;
  city?:       string;
  category?:   string;
  owner?:      { name?: string; fullName?: string; email?: string };
  createdAt?:  string;
}
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
  { id: 'listings', label: 'Listings',  icon: <Package         className="w-4 h-4" /> },
  { id: 'bookings', label: 'Bookings',  icon: <CalendarCheck   className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [listings,  setListings]  = useState<AdminListing[]>([]);
  const [bookings,  setBookings]  = useState<AdminBooking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [listingFilter, setListingFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  const [busy,      setBusy]      = useState<Set<string>>(new Set());

  // Redirect non-admins
  useEffect(() => {
    if (isAuthenticated && !isAdmin) router.replace('/');
  }, [isAuthenticated, isAdmin, router]);

  // Load data for current tab
  const loadTab = useCallback(async (tab: TabId) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'overview': {
          const res = await api.get<DashboardStats>('/admin/dashboard/stats');
          console.log('[admin] stats:', res.data);
          setStats(res.data);
          break;
        }
        case 'users':
        case 'owners': {
          const res = await api.get<{ content: AdminUser[] }>('/admin/users');
          console.log('[admin] users:', res.data.content);
          setUsers(Array.isArray(res.data.content) ? res.data.content : []);
          break;
        }
        case 'listings': {
          const res = await api.get<{ content: AdminListing[] }>('/admin/listings');
          console.log('[admin] listings:', res.data.content);
          setListings(Array.isArray(res.data.content) ? res.data.content : []);
          break;
        }
        case 'bookings': {
          const res = await api.get<{ content: AdminBooking[] }>('/admin/bookings');
          console.log('[admin] bookings:', res.data.content);
          setBookings(Array.isArray(res.data.content) ? res.data.content : []);
          break;
        }
      }
    } catch (err: any) {
      toast.error(`Failed to load ${tab}: ${err?.response?.data?.message ?? err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadTab(activeTab); }, [activeTab, isAdmin, loadTab]);
  useEffect(() => { if (isAdmin) loadTab('overview'); }, [isAdmin]); // eslint-disable-line

  // ── Admin actions ────────────────────────────────────────────────────────────
  async function toggleListingActive(id: string, current: boolean) {
    setBusy(p => new Set(p).add(id));
    try {
      await api.patch(`/admin/listings/${id}`, { isAvailable: !current, isPublished: !current });
      setListings(p => p.map(l => l.id === id
        ? { ...l, isAvailable: !current, isPublished: !current } : l));
      toast.success(!current ? 'Listing activated.' : 'Listing deactivated.');
    } catch { toast.error('Failed to update listing.'); }
    finally { setBusy(p => { const s = new Set(p); s.delete(id); return s; }); }
  }

  async function approveKyc(userId: string) {
    setBusy(p => new Set(p).add(userId));
    try {
      await api.patch(`/admin/users/${userId}/kyc`, { kycStatus: 'APPROVED' });
      setUsers(p => p.map(u => u.id === userId ? { ...u, kycStatus: 'APPROVED' } : u));
      toast.success('KYC approved.');
    } catch { toast.error('Failed to approve KYC.'); }
    finally { setBusy(p => { const s = new Set(p); s.delete(userId); return s; }); }
  }

  async function rejectKyc(userId: string) {
    setBusy(p => new Set(p).add(userId + '_r'));
    try {
      await api.patch(`/admin/users/${userId}/kyc`, { kycStatus: 'REJECTED' });
      setUsers(p => p.map(u => u.id === userId ? { ...u, kycStatus: 'REJECTED' } : u));
      toast.success('KYC rejected.');
    } catch { toast.error('Failed to reject KYC.'); }
    finally { setBusy(p => { const s = new Set(p); s.delete(userId + '_r'); return s; }); }
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const q = search.toLowerCase();

  const filteredUsers = users.filter(u => {
    const role = (u.userType ?? u.role ?? '').toUpperCase();
    if (activeTab === 'owners' && role !== 'OWNER') return false;
    if (!q) return true;
    return (u.name ?? u.fullName ?? '').toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
  });

  const filteredListings = listings.filter(l => {
    if (listingFilter === 'PENDING') return !l.isPublished;
    if (listingFilter === 'ACTIVE')  return l.isPublished && l.isAvailable;
    return true;
  }).filter(l => !q
    || l.title.toLowerCase().includes(q)
    || (l.city  ?? '').toLowerCase().includes(q)
    || ((l.owner?.name ?? l.owner?.fullName ?? '').toLowerCase().includes(q)));

  const filteredBookings = bookings.filter(b =>
    !q
    || b.status.toLowerCase().includes(q)
    || (b.listing?.title  ?? '').toLowerCase().includes(q)
    || (b.renter?.name ?? b.renter?.fullName ?? '').toLowerCase().includes(q),
  );

  if (!isAdmin) return null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base font-bold text-gray-900">Admin Dashboard</h1>
            <button onClick={() => loadTab(activeTab)}
                    className="flex items-center gap-1.5 text-xs text-gray-500
                               hover:text-gray-900 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Tab Bar */}
          <nav className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium
                                  border-b-2 whitespace-nowrap transition-colors
                                  ${activeTab === tab.id
                                    ? 'border-[#16a34a] text-[#16a34a]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.icon}
                {tab.label}
                {/* Badges */}
                {tab.id === 'users' && users.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {users.filter(u => (u.userType ?? u.role ?? '').toUpperCase() === 'RENTER').length}
                  </span>
                )}
                {tab.id === 'owners' && users.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {users.filter(u => (u.userType ?? u.role ?? '').toUpperCase() === 'OWNER').length}
                  </span>
                )}
                {tab.id === 'listings' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">
                    {listings.filter(l => !l.isPublished).length || ''}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading && activeTab !== 'overview' ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TAB: Overview ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                        <div className="h-7 bg-gray-200 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <StatCard icon={<Users className="w-5 h-5 text-blue-500" />}
                                label="Total Users"    value={stats.totalUsers}    />
                      <StatCard icon={<Store className="w-5 h-5 text-purple-500" />}
                                label="Owners"         value={stats.totalOwners}   />
                      <StatCard icon={<Package className="w-5 h-5 text-[#16a34a]" />}
                                label="Listings"       value={stats.totalListings}  />
                      <StatCard icon={<CalendarCheck className="w-5 h-5 text-orange-500" />}
                                label="Bookings"       value={stats.totalBookings}  />
                      <StatCard icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
                                label="Revenue"        value={`₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} />
                      <StatCard icon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
                                label="Pending KYC"   value={stats.pendingKYC}    accent />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Review KYC Applications', tab: 'users'    as TabId, count: stats.pendingKYC,    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                        { label: 'Pending Listings',        tab: 'listings' as TabId, count: listings.filter(l => !l.isPublished).length, color: 'text-orange-600 bg-orange-50 border-orange-200' },
                        { label: 'View All Bookings',       tab: 'bookings' as TabId, count: stats.totalBookings,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
                      ].map(a => (
                        <button key={a.tab}
                                onClick={() => setActiveTab(a.tab)}
                                className={`flex items-center justify-between p-4 rounded-2xl border
                                            text-left hover:shadow-sm transition-shadow ${a.color}`}>
                          <div>
                            <p className="text-sm font-semibold">{a.label}</p>
                            <p className="text-2xl font-bold mt-1">{a.count}</p>
                          </div>
                          <ChevronDown className="w-5 h-5 rotate-[-90deg] opacity-60" />
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
                             ? 'Search owners by name or email…'
                             : 'Search users by name or email…'} />
                <p className="text-xs text-gray-400 mb-4">
                  {filteredUsers.length} {activeTab === 'owners' ? 'owner' : 'user'}
                  {filteredUsers.length !== 1 ? 's' : ''}
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Email</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Role</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">KYC</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users found</td></tr>
                        ) : filteredUsers.map(u => {
                          const role = (u.userType ?? u.role ?? '').toUpperCase();
                          const kyc  = u.kycStatus ?? 'PENDING';
                          const name = u.name ?? u.fullName ?? '—';
                          return (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center
                                                  justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-gray-900">{name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                                  ${role === 'OWNER'       ? 'bg-purple-100 text-purple-700' :
                                    role === 'ADMIN' || role === 'SUPER_ADMIN'
                                                           ? 'bg-red-100 text-red-700'
                                                           : 'bg-blue-100 text-blue-700'}`}>
                                  {role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                                  ${kyc === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    kyc === 'REJECTED'  ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'}`}>
                                  {kyc}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {kyc === 'PENDING' && (
                                  <div className="flex items-center gap-1.5">
                                    <ActionBtn
                                      onClick={() => approveKyc(u.id)}
                                      loading={busy.has(u.id)}
                                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                      label="Approve" variant="green" />
                                    <ActionBtn
                                      onClick={() => rejectKyc(u.id)}
                                      loading={busy.has(u.id + '_r')}
                                      icon={<XCircle className="w-3.5 h-3.5" />}
                                      label="Reject" variant="red" />
                                  </div>
                                )}
                                {kyc === 'APPROVED' && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Verified
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
                <div className="flex gap-3 mb-4 flex-wrap">
                  <SearchBar value={search} onChange={setSearch} placeholder="Search listings…" />
                  <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {(['ALL', 'ACTIVE', 'PENDING'] as const).map(f => (
                      <button key={f}
                              onClick={() => setListingFilter(f)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
                                ${listingFilter === f
                                  ? 'bg-[#16a34a] text-white'
                                  : 'text-gray-500 hover:text-gray-700'}`}>
                        {f}
                        {f === 'PENDING' && listings.filter(l => !l.isPublished).length > 0 && (
                          <span className="ml-1.5 bg-white/20 rounded-full px-1.5">
                            {listings.filter(l => !l.isPublished).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4">{filteredListings.length} listings</p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Title</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Owner</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">City</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Price/day</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredListings.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-12 text-gray-400">No listings found</td></tr>
                        ) : filteredListings.map(l => (
                          <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate max-w-[180px]">{l.title}</p>
                              <p className="text-xs text-gray-400">{l.category}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {l.owner?.name ?? l.owner?.fullName ?? l.owner?.email ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{l.city ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">
                              ₹{(l.pricePerDay ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                                ${l.isPublished && l.isAvailable ? 'bg-green-100 text-green-700' :
                                  l.isPublished                  ? 'bg-yellow-100 text-yellow-700'
                                                                 : 'bg-red-100 text-red-700'}`}>
                                {l.isPublished && l.isAvailable ? 'Active' :
                                 l.isPublished                  ? 'Unavailable' : 'Unpublished'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <ActionBtn
                                onClick={() => toggleListingActive(l.id, l.isPublished)}
                                loading={busy.has(l.id)}
                                icon={l.isPublished
                                  ? <Ban         className="w-3.5 h-3.5" />
                                  : <CheckCircle2 className="w-3.5 h-3.5" />}
                                label={l.isPublished ? 'Deactivate' : 'Activate'}
                                variant={l.isPublished ? 'red' : 'green'} />
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
                           placeholder="Search by renter, listing, or status…" />
                <p className="text-xs text-gray-400 mb-4">{filteredBookings.length} bookings</p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Listing</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Renter</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Dates</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Amount</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredBookings.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-12 text-gray-400">No bookings found</td></tr>
                        ) : filteredBookings.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate max-w-[160px]">
                                {b.listing?.title ?? '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {b.renter?.name ?? b.renter?.fullName ?? b.renter?.email ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs tabular-nums">
                              {b.startDate ?? '—'} → {b.endDate ?? '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">
                              ₹{(b.totalPrice ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
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
    <div className={`bg-white rounded-2xl border shadow-sm p-5
                     ${accent ? 'border-yellow-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums
                     ${accent ? 'text-yellow-600' : 'text-gray-900'}`}>
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
    <div className="relative mb-4 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
      />
    </div>
  );
}

function ActionBtn({ onClick, loading, icon, label, variant }: {
  onClick:  () => void;
  loading:  boolean;
  icon:     React.ReactNode;
  label:    string;
  variant:  'green' | 'red' | 'blue';
}) {
  const colors = {
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    red:   'bg-red-50 text-red-700 hover:bg-red-100',
    blue:  'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  return (
    <button onClick={onClick} disabled={loading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                        transition-colors disabled:opacity-50 ${colors[variant]}`}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-gray-600 font-medium mb-4">Failed to load dashboard data</p>
      <button onClick={onRetry}
              className="px-5 py-2 bg-[#16a34a] text-white text-sm font-semibold
                         rounded-xl hover:bg-[#15803d] transition-colors">
        Retry
      </button>
    </div>
  );
}
