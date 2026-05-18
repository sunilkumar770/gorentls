'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Shield, Users, Package, TrendingUp,
  CheckCircle2, XCircle, Building2, BookOpen,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Search, X, ClipboardList, CreditCard, Coins, Banknote,
} from 'lucide-react';
import {
  adminService,
  type AdminStats,
  type AdminUser,
  type AdminBooking,
  type AuditLog,
  type AdminListing,
  type AdminPayout,
  type AdminLedgerTransaction,
  type AdminOwnerPayoutAccount,
} from '@/services/admin';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';

type Tab = 'overview' | 'users' | 'owners' | 'listings' | 'bookings' | 'payouts' | 'ledger' | 'payout-accounts' | 'audit';

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status ?? '').toUpperCase();
  const map: Record<string, string> = {
    ACTIVE: 'bg-[#f97316]/10 text-[#9d4300]',
    CONFIRMED: 'bg-blue-100/50 text-blue-700',
    APPROVED: 'bg-red-100/50 text-red-700',
    PENDING: 'bg-amber-100/50 text-amber-700',
    COMPLETED: 'bg-[#251913]/5 text-[#8c7164]',
    REJECTED: 'bg-red-100/50 text-red-600',
    CANCELLED: 'bg-red-100/50 text-red-600',
    SUSPENDED: 'bg-red-100/50 text-red-600',
    PAID: 'bg-red-100/50 text-red-700',
    UNPAID: 'bg-amber-100/50 text-amber-700',
    RENTER: 'bg-sky-100/50 text-sky-700',
    OWNER: 'bg-purple-100/50 text-purple-700',
    ADMIN: 'bg-[#f97316] text-white',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[s] ?? 'bg-[#251913]/5 text-[#8c7164]'}`}>
      {status ?? '—'}
    </span>
  );
}

function Pagination({
  page, totalPages, onPrev, onNext,
}: {
  page: number; totalPages: number;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3 justify-end mt-4">
      <button onClick={onPrev} disabled={page === 0}
        className="p-1.5 rounded-lg border border-[#251913]/10 disabled:opacity-40 hover:bg-[#251913]/5 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-[#8c7164]">
        Page {page + 1} of {Math.max(totalPages, 1)}
      </span>
      <button onClick={onNext} disabled={page >= totalPages - 1}
        className="p-1.5 rounded-lg border border-[#251913]/10 disabled:opacity-40 hover:bg-[#251913]/5 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StatCard({ label, value, icon, subtext, accent = false }: {
  label: string; value: string | number;
  icon: ReactNode; subtext: string; accent?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-ambient border border-[#e0c0b1]/20 hover:border-[#f97316]/30 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${accent ? 'bg-[#f97316]/10 text-[#f97316]' : 'bg-[#251913]/5 text-[#251913]'
        }`}>
        {icon}
      </div>
      <div className="font-display text-3xl font-bold text-[#251913] leading-none">{value}</div>
      <div className="text-sm font-bold text-[#251913] mt-2 uppercase tracking-wide">{label}</div>
      <div className="text-xs font-medium text-[#8c7164] mt-1">{subtext}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, variant = 'default', disabled = false }: {
  label: string; onClick: () => void;
  variant?: 'default' | 'danger' | 'success'; disabled?: boolean;
}) {
  const styles = {
    default: 'bg-[#251913]/5 text-[#251913] hover:bg-[#251913]/10',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    success: 'bg-red-50 text-red-700 hover:bg-red-100',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}>
      {disabled ? '...' : label}
    </button>
  );
}

function Th({ children }: { children: string }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-[#8c7164] uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

/** Search bar with a clear (×) button */
function SearchBar({
  value, onChange, placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative max-w-md">
      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7164]" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl border border-[#e0c0b1]/30 bg-card
                   focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 placeholder:text-[#8c7164]/50 shadow-sm"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7164] hover:text-[#f97316] transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stats, onRetry }: { stats: AdminStats; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers}
          icon={<Users size={20} />}
          subtext={`${stats.totalOwners} Owners · ${stats.totalRenters} Renters`} />
        <StatCard label="Total Listings" value={stats.totalListings}
          icon={<Package size={20} />}
          subtext={`${stats.pendingListings} Pending · ${stats.activeListings} Active`} />
        <StatCard label="Total Bookings" value={stats.totalBookings}
          icon={<BookOpen size={20} />}
          subtext={`${stats.activeBookings} Active · ${stats.completedBookings} Completed`} />
        <StatCard label="Platform Revenue" value={formatCurrency(stats.totalRevenue)}
          icon={<TrendingUp size={20} />}
          subtext={`Commission: ${formatCurrency(stats.platformCommission)}`}
          accent />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Pending KYC" value={stats.pendingKYC}
          icon={<AlertCircle size={20} />}
          subtext="Users awaiting identity verification" accent />
        <StatCard label="Pending Owner Verifications" value={stats.pendingOwnerVerifications}
          icon={<Building2 size={20} />}
          subtext="Owner accounts to review" />
        <StatCard label="Active Listings" value={stats.activeListings}
          icon={<CheckCircle2 size={20} />}
          subtext="Live and rentable on platform" />
      </div>
      <div className="flex justify-end">
        <button onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-[#8c7164] hover:text-[#251913] transition-colors">
          <RefreshCw size={12} /> Refresh stats
        </button>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getUsers(page, 20, debouncedSearch);
      setUsers(d.content);
      setTotalPages(d.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  // Reset to page 0 when search changes
  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || "An unexpected error occurred.";
      alert("Action Failed: " + errMsg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email or phone…" />
      {loading ? <Loader label="users" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Type</Th><Th>Status</Th><Th>Verified</Th><Th>Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {users.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">
                  {search ? `No users match "${search}"` : 'No users found.'}
                </td></tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td><span className="font-semibold text-[#251913]">{u.fullName}</span></Td>
                  <Td><span className="text-[#8c7164] text-xs">{u.email}</span></Td>
                  <Td><span className="text-[#8c7164]">{u.phone || '—'}</span></Td>
                  <Td><StatusBadge status={u.userType} /></Td>
                  <Td><StatusBadge status={u.isActive ? 'ACTIVE' : 'SUSPENDED'} /></Td>
                  <Td>
                    {u.isVerified
                      ? <CheckCircle2 size={16} className="text-red-500" />
                      : <XCircle size={16} className="text-yellow-500" />}
                  </Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      {!u.isVerified && u.userType !== 'ADMIN' && (
                        <ActionBtn label="Verify KYC" variant="success"
                          disabled={busy === u.id}
                          onClick={() => act(u.id, () => adminService.verifyUserKYC(u.id))} />
                      )}
                      {u.isActive && u.userType !== 'ADMIN' && (
                        <ActionBtn label="Suspend" variant="danger"
                          disabled={busy === u.id}
                          onClick={() => act(u.id, () => adminService.suspendUser(u.id))} />
                      )}
                      {!u.isActive && u.userType !== 'ADMIN' && (
                        <ActionBtn label="Restore" variant="success"
                          disabled={busy === u.id}
                          onClick={() => act(u.id, () => adminService.unsuspendUser(u.id))} />
                      )}
                      {u.userType !== 'ADMIN' && (
                        <ActionBtn label="Delete" variant="danger"
                          disabled={busy === u.id}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete/anonymize the user "${u.fullName}"? This action cannot be undone.`)) {
                              act(u.id, () => adminService.deleteUser(u.id));
                            }
                          }} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Owners Tab ───────────────────────────────────────────────────────────────

function OwnersTab() {
  const [owners, setOwners] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getOwners(page, 20, debouncedSearch);
      setOwners(d.content);
      setTotalPages(d.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || "An unexpected error occurred.";
      alert("Action Failed: " + errMsg);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => { setPage(0); }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <SearchBar value={search} onChange={setSearch} placeholder="Search owners by name, email or phone…" />
      {loading ? <Loader label="owners" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Status</Th><Th>Verified</Th><Th>Joined</Th><Th>Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {owners.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">
                  {search ? `No owners match "${search}"` : 'No owners found.'}
                </td></tr>
              )}
              {owners.map(o => (
                <tr key={o.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td><span className="font-semibold text-[#251913]">{o.fullName}</span></Td>
                  <Td><span className="text-[#8c7164] text-xs">{o.email}</span></Td>
                  <Td><span className="text-[#8c7164]">{o.phone || '—'}</span></Td>
                  <Td><StatusBadge status={o.isActive ? 'ACTIVE' : 'SUSPENDED'} /></Td>
                  <Td>
                    {o.isVerified
                      ? <CheckCircle2 size={16} className="text-red-500" />
                      : <XCircle size={16} className="text-yellow-500" />}
                  </Td>
                  <Td><span className="text-[#8c7164] text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</span></Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      {!o.isVerified && (
                        <ActionBtn label="Verify Owner" variant="success"
                          disabled={busy === o.id}
                          onClick={() => act(o.id, () => adminService.verifyOwner(o.id))} />
                      )}
                      {o.isActive && (
                        <ActionBtn label="Suspend" variant="danger"
                          disabled={busy === o.id}
                          onClick={() => act(o.id, () => adminService.suspendUser(o.id))} />
                      )}
                      {!o.isActive && (
                        <ActionBtn label="Restore" variant="success"
                          disabled={busy === o.id}
                          onClick={() => act(o.id, () => adminService.unsuspendUser(o.id))} />
                      )}
                      <ActionBtn label="Delete" variant="danger"
                        disabled={busy === o.id}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete/anonymize the owner "${o.fullName}"? This action cannot be undone.`)) {
                            act(o.id, () => adminService.deleteUser(o.id));
                          }
                        }} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Listings Tab ─────────────────────────────────────────────────────────────

function ListingsTab() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = filter === 'all'
        ? await adminService.getAllListings(page)
        : await adminService.getPendingListings(page);
      setListings(d.content);
      setTotalPages(d.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.message || e.message || "An unexpected error occurred.";
      alert("Action Failed: " + errMsg);
    } finally {
      setBusy(null);
    }
  };

  const getStatus = (l: AdminListing) => l.approvalStatus || (l.is_published ? 'LIVE' : 'PENDING');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'pending'] as const).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filter === f
                ? 'bg-[#f97316] text-white shadow-sm'
                : 'bg-[#251913]/5 text-[#8c7164] hover:bg-[#251913]/10'
              }`}>
            {f === 'all' ? 'All Listings' : 'Pending Approval'}
          </button>
        ))}
      </div>

      {loading ? <Loader label="listings" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr><Th>Title</Th><Th>Category</Th><Th>City</Th><Th>Owner</Th><Th>Price/Day</Th><Th>Status</Th><Th>Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {listings.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">No listings found.</td></tr>
              )}
              {listings.map((l: AdminListing) => (
                <tr key={l.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td>
                    <span className="font-semibold text-[#251913] block max-w-[160px] truncate">{l.title}</span>
                  </Td>
                  <Td><span className="text-[#8c7164]">{l.category || '—'}</span></Td>
                  <Td><span className="text-[#8c7164]">{l.city || '—'}</span></Td>
                  <Td>
                    <span className="text-[#251913] font-medium">{l.ownerName || l.owner?.fullName || '—'}</span>
                    <span className="block text-xs text-[#8c7164]">{l.owner?.email || ''}</span>
                  </Td>
                  <Td>
                    <span className="font-medium text-[#251913]">
                      {formatCurrency(l.pricePerDay ?? l.price_per_day ?? l.rentalPricePerDay ?? 0)}
                    </span>
                  </Td>
                  <Td><StatusBadge status={getStatus(l)} /></Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      {(getStatus(l) === 'PENDING' || l.approvalStatus === 'PENDING' || l.isPublished === false || l.is_published === false) && (
                        <>
                          <ActionBtn label="Approve" variant="success"
                            disabled={busy === l.id}
                            onClick={() => act(l.id, () => adminService.approveListing(l.id))} />
                          <ActionBtn label="Reject" variant="danger"
                            disabled={busy === l.id}
                            onClick={() => act(l.id, () => adminService.rejectListing(l.id))} />
                        </>
                      )}
                      <ActionBtn label="Delete" variant="danger"
                        disabled={busy === l.id}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete/anonymize the listing "${l.title}"? This action cannot be undone.`)) {
                            act(l.id, () => adminService.deleteListing(l.id));
                          }
                        }} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getAllBookings(page);
      setBookings(d.content);
      setTotalPages(d.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <Loader label="bookings" />;

  return (
    <div>
      <TableWrap>
        <thead className="bg-[#251913]/[0.04]">
          <tr><Th>Listing</Th><Th>Renter</Th><Th>Owner</Th><Th>Dates</Th><Th>Amount</Th><Th>Status</Th><Th>Payment</Th></tr>
        </thead>
        <tbody className="divide-y divide-[#251913]/5">
          {bookings.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">No bookings found.</td></tr>
          )}
          {bookings.map(b => (
            <tr key={b.id} className="hover:bg-[#251913]/[0.02] transition-colors">
              <Td>
                <span className="font-semibold text-[#251913] block max-w-[140px] truncate">{b.listing?.title}</span>
                <span className="text-xs text-[#8c7164]">{b.listing?.city}</span>
              </Td>
              <Td>
                <span className="font-medium text-[#251913]">{b.renter?.fullName}</span>
                <span className="block text-xs text-[#8c7164]">{b.renter?.email}</span>
              </Td>
              <Td>
                <span className="text-[#251913]">{b.listing?.owner?.fullName}</span>
                <span className="block text-xs text-[#8c7164]">{b.listing?.owner?.email}</span>
              </Td>
              <Td>
                <span className="text-[#8c7164] text-xs">{fmt(b.startDate)}</span>
                <span className="block text-[#8c7164] text-xs">→ {fmt(b.endDate)}</span>
              </Td>
              <Td>
                <span className="font-semibold text-[#251913]">{formatCurrency(b.totalAmount)}</span>
                <span className="block text-xs text-[#8c7164]">{b.totalDays}d</span>
              </Td>
              <Td><StatusBadge status={b.status} /></Td>
              <Td><StatusBadge status={b.paymentStatus} /></Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pagination page={page} totalPages={totalPages}
        onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

/** Action badge colours for audit log */
const actionColour = (action: string): string => {
  const a = action.toUpperCase();
  if (a.includes('SUSPEND') || a.includes('REJECT')) return 'bg-red-100 text-red-600';
  if (a.includes('VERIFY') || a.includes('APPROVE') || a.includes('UNSUSPEND')) return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};

function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getAuditLog(page);
      setLogs(d.content);
      setTotalPages(d.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  if (loading) return <Loader label="audit log" />;

  return (
    <div>
      <TableWrap>
        <thead className="bg-[#251913]/[0.04]">
          <tr><Th>Time</Th><Th>Admin</Th><Th>Action</Th><Th>Entity</Th><Th>Description</Th><Th>IP</Th></tr>
        </thead>
        <tbody className="divide-y divide-[#251913]/5">
          {logs.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-[#8c7164]">
              No audit entries yet. Actions like Verify, Suspend, Approve will appear here.
            </td></tr>
          )}
          {logs.map(l => (
            <tr key={l.id} className="hover:bg-[#251913]/[0.02] transition-colors">
              <Td><span className="text-[#8c7164] text-xs whitespace-nowrap">{fmt(l.createdAt)}</span></Td>
              <Td><span className="text-xs font-medium text-[#251913]">{l.adminEmail}</span></Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${actionColour(l.action)}`}>
                  {l.action}
                </span>
              </Td>
              <Td>
                <span className="text-xs text-[#8c7164]">{l.entityType}</span>
                {l.entityId && (
                  <span className="block text-xs text-[#8c7164]/60 font-mono truncate max-w-[100px]">
                    {l.entityId.slice(0, 8)}…
                  </span>
                )}
              </Td>
              <Td><span className="text-xs text-[#251913]">{l.description}</span></Td>
              <Td><span className="text-xs text-[#8c7164] font-mono">{l.ipAddress || '—'}</span></Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pagination page={page} totalPages={totalPages}
        onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────────────────────

function PayoutsTab({ payoutTrigger, onPayoutAltered }: { payoutTrigger: number; onPayoutAltered: () => void }) {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const debouncedOwnerId = useDebounce(ownerId, 350);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getPayouts(page, 20, status || undefined, debouncedOwnerId || undefined);
      setPayouts(d.content);
      setTotalPages(d.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedOwnerId, payoutTrigger]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedOwnerId]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    try {
      await fn();
      await load();
      onPayoutAltered();
    } catch (e) {
      console.error(e);
      alert('Action failed. Check logs.');
    } finally {
      setBusy(null);
    }
  };

  const forceFailed = async (id: string) => {
    const reason = prompt('Enter failure reason:', 'Manual override');
    if (reason === null) return;
    await act(id, () => adminService.forceFailedPayout(id, reason));
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-[#e0c0b1]/30 bg-card focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="INITIATED">Initiated</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
          <SearchBar value={ownerId} onChange={v => { setOwnerId(v); setPage(0); }} placeholder="Filter by Owner UUID" />
        </div>
      </div>

      {loading ? <Loader label="payouts" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr>
                <Th>Booking</Th>
                <Th>Owner</Th>
                <Th>Amounts (Gross / TDS / Net)</Th>
                <Th>Status</Th>
                <Th>Schedule / Executed</Th>
                <Th>Gateway Ref</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">
                    No payouts found matching criteria.
                  </td>
                </tr>
              )}
              {payouts.map(p => (
                <tr key={p.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td>
                    <span className="block text-xs font-mono text-[#251913] truncate max-w-[100px]" title={p.bookingId}>
                      {p.bookingId.slice(0, 8)}…
                    </span>
                  </Td>
                  <Td>
                    <span className="block text-xs font-mono text-[#8c7164] truncate max-w-[100px]" title={p.ownerId}>
                      {p.ownerId.slice(0, 8)}…
                    </span>
                  </Td>
                  <Td>
                    <div className="text-xs">
                      <div className="font-bold text-[#251913]">{formatCurrency(p.grossAmount)} Gross</div>
                      <div className="text-[#8c7164]">{formatCurrency(p.tdsAmount)} TDS (1%)</div>
                      <div className="font-bold text-emerald-700">{formatCurrency(p.netAmount)} Net</div>
                    </div>
                  </Td>
                  <Td>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      p.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-800' :
                      p.status === 'INITIATED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {p.status}
                    </span>
                    {p.failureReason && (
                      <span className="block text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={p.failureReason}>
                        {p.failureReason}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="text-[11px] text-[#8c7164] space-y-0.5">
                      <div>Scheduled: {fmt(p.scheduledAt)}</div>
                      <div>Executed: {fmt(p.executedAt)}</div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-[11px] font-mono text-[#8c7164]">
                      {p.rpPayoutId ? (
                        <span className="bg-card px-1.5 py-0.5 rounded border border-[#e0c0b1]/30">{p.rpPayoutId}</span>
                      ) : '—'}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === 'ON_HOLD' && (
                        <ActionBtn label="Release" onClick={() => act(p.id, () => adminService.releasePayout(p.id))} variant="success" disabled={busy === p.id} />
                      )}
                      {p.status === 'PENDING' && (
                        <>
                          <ActionBtn label="Hold" onClick={() => act(p.id, () => adminService.holdPayout(p.id))} disabled={busy === p.id} />
                          <ActionBtn label="Success" onClick={() => act(p.id, () => adminService.forceSuccessPayout(p.id))} variant="success" disabled={busy === p.id} />
                          <ActionBtn label="Fail" onClick={() => forceFailed(p.id)} variant="danger" disabled={busy === p.id} />
                        </>
                      )}
                      {p.status === 'INITIATED' && (
                        <>
                          <ActionBtn label="Success" onClick={() => act(p.id, () => adminService.forceSuccessPayout(p.id))} variant="success" disabled={busy === p.id} />
                          <ActionBtn label="Fail" onClick={() => forceFailed(p.id)} variant="danger" disabled={busy === p.id} />
                        </>
                      )}
                      {p.status === 'FAILED' && (
                        <ActionBtn label="Force Success" onClick={() => act(p.id, () => adminService.forceSuccessPayout(p.id))} variant="success" disabled={busy === p.id} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────

function LedgerTab({ payoutTrigger }: { payoutTrigger: number }) {
  const [transactions, setTransactions] = useState<AdminLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [account, setAccount] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getLedger(page, 20, account || undefined);
      setTransactions(d.content);
      setTotalPages(d.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, account, payoutTrigger]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 items-center">
          <select
            value={account}
            onChange={e => { setAccount(e.target.value); setPage(0); }}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-[#e0c0b1]/30 bg-card focus:outline-none"
          >
            <option value="">All Ledger Accounts</option>
            <option value="BANK_SETTLEMENT">Bank Settlement</option>
            <option value="RENTER_ESCROW">Renter Escrow</option>
            <option value="OWNER_ESCROW">Owner Escrow</option>
            <option value="SECURITY_HOLD">Security Hold</option>
            <option value="PLATFORM_FEE">Platform Fee</option>
            <option value="TAX_TCS">Tax TCS (1%)</option>
            <option value="TAX_TDS">Tax TDS (1%)</option>
          </select>
        </div>
      </div>

      {loading ? <Loader label="ledger transactions" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr>
                <Th>Time</Th>
                <Th>Ledger Account</Th>
                <Th>Direction</Th>
                <Th>Amount</Th>
                <Th>Booking</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8c7164]">
                    No ledger entries found.
                  </td>
                </tr>
              )}
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td>
                    <span className="text-[#8c7164] text-xs whitespace-nowrap">{fmt(t.createdAt)}</span>
                  </Td>
                  <Td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      t.account === 'PLATFORM_FEE' ? 'bg-emerald-100 text-emerald-800' :
                      t.account === 'BANK_SETTLEMENT' ? 'bg-blue-100 text-blue-800' :
                      t.account === 'RENTER_ESCROW' || t.account === 'OWNER_ESCROW' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t.account}
                    </span>
                  </Td>
                  <Td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      t.direction === 'CREDIT' ? 'bg-green-100/50 text-green-700' : 'bg-rose-100/50 text-rose-700'
                    }`}>
                      {t.direction}
                    </span>
                  </Td>
                  <Td>
                    <span className={`text-sm font-bold ${
                      t.direction === 'CREDIT' ? 'text-green-700' : 'text-rose-700'
                    }`}>
                      {t.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-[#8c7164] truncate max-w-[100px]" title={t.bookingId}>
                      {t.bookingId.slice(0, 8)}…
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-[#251913] font-medium">{t.reason}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Payout Accounts Tab ──────────────────────────────────────────────────────

function PayoutAccountsTab({ onPayoutAltered }: { onPayoutAltered: () => void }) {
  const [accounts, setAccounts] = useState<AdminOwnerPayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminService.getOwnerPayoutAccounts(page, 20, status || undefined);
      setAccounts(d.content);
      setTotalPages(d.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    try {
      await fn();
      await load();
      onPayoutAltered();
    } catch (e) {
      console.error(e);
      alert('Action failed. Check logs.');
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async (accountId: string) => {
    const fundAccountId = prompt('Enter RazorpayX Fund Account ID (Optional):');
    if (fundAccountId === null) return;
    const ref = prompt('Enter Penny-drop Verification Reference (Optional):');
    if (ref === null) return;
    await act(accountId, () => adminService.verifyOwnerPayoutAccount(accountId, fundAccountId || undefined, ref || undefined));
  };

  const handleReinstate = async (accountId: string) => {
    const ref = prompt('Enter Verification Reference (Optional):');
    if (ref === null) return;
    await act(accountId, () => adminService.reinstateOwnerPayoutAccount(accountId, ref || undefined));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm font-medium rounded-xl border border-[#e0c0b1]/30 bg-card focus:outline-none"
        >
          <option value="">All Account Statuses</option>
          <option value="PENDING">Pending Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {loading ? <Loader label="owner payout accounts" /> : (
        <>
          <TableWrap>
            <thead className="bg-[#251913]/[0.04]">
              <tr>
                <Th>Owner</Th>
                <Th>Account Type</Th>
                <Th>Account Details</Th>
                <Th>Fund Account ID</Th>
                <Th>Status</Th>
                <Th>Verification Ref</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#251913]/5">
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8c7164]">
                    No payout accounts registered.
                  </td>
                </tr>
              )}
              {accounts.map(a => (
                <tr key={a.id} className="hover:bg-[#251913]/[0.02] transition-colors">
                  <Td>
                    <span className="block text-xs font-mono text-[#251913] truncate max-w-[100px]" title={a.ownerId}>
                      {a.ownerId.slice(0, 8)}…
                    </span>
                  </Td>
                  <Td>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      {a.accountType}
                    </span>
                  </Td>
                  <Td>
                    {a.accountType === 'BANK' ? (
                      <div className="text-xs">
                        <div className="font-medium text-[#251913]">A/C: {a.accountNumber}</div>
                        <div className="text-[#8c7164] font-mono">IFSC: {a.ifsc}</div>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-[#251913]">{a.upiId}</div>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-[#8c7164]">
                      {a.fundAccountId || '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      a.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      a.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {a.status}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-[#8c7164]">
                      {a.verificationRef || '—'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === 'PENDING' && (
                        <>
                          <ActionBtn label="Verify" onClick={() => handleVerify(a.id)} variant="success" disabled={busy === a.id} />
                          <ActionBtn label="Block" onClick={() => act(a.id, () => adminService.blockOwnerPayoutAccount(a.id))} variant="danger" disabled={busy === a.id} />
                        </>
                      )}
                      {a.status === 'VERIFIED' && (
                        <>
                          <ActionBtn label="Suspend" onClick={() => act(a.id, () => adminService.suspendOwnerPayoutAccount(a.id))} disabled={busy === a.id} />
                          <ActionBtn label="Block" onClick={() => act(a.id, () => adminService.blockOwnerPayoutAccount(a.id))} variant="danger" disabled={busy === a.id} />
                        </>
                      )}
                      {(a.status === 'SUSPENDED' || a.status === 'BLOCKED') && (
                        <ActionBtn label="Reinstate" onClick={() => handleReinstate(a.id)} variant="success" disabled={busy === a.id} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={page} totalPages={totalPages}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function Loader({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-[#8c7164] text-sm">
      Loading {label}…
    </div>
  );
}

function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-[#e0c0b1]/20 bg-card shadow-ambient">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [payoutTrigger, setPayoutTrigger] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/login?from=/admin');
    }
  }, [authLoading, user, isAdmin, router]);

  const loadStats = useCallback(() => {
    if (!isAdmin) return;
    setStatsLoading(true);
    setStatsError(false);
    adminService.getStats()
      .then(d => setStats(d))
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin, loadStats]);

  const handlePayoutAltered = useCallback(() => {
    setPayoutTrigger(prev => prev + 1);
    loadStats();
  }, [loadStats]);

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview',        label: 'Overview',        icon: <TrendingUp size={15} /> },
    { id: 'users',           label: 'Users',           icon: <Users size={15} /> },
    { id: 'owners',          label: 'Owners',          icon: <Building2 size={15} /> },
    { id: 'listings',        label: 'Listings',        icon: <Package size={15} /> },
    { id: 'bookings',        label: 'Bookings',        icon: <BookOpen size={15} /> },
    { id: 'payouts',         label: 'Payouts Log',     icon: <Banknote size={15} /> },
    { id: 'ledger',          label: 'Ledger Audit',    icon: <Coins size={15} /> },
    { id: 'payout-accounts', label: 'Payout Accs',     icon: <CreditCard size={15} /> },
    { id: 'audit',           label: 'Audit Log',       icon: <ClipboardList size={15} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#251913] rounded-2xl flex items-center justify-center shadow-ambient">
            <Shield size={24} className="text-[#f97316]" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-[#251913] tracking-tight">Control Center</h1>
            <p className="text-xs font-bold text-[#8c7164] uppercase tracking-widest mt-1">System-wide Authority</p>
          </div>
        </div>
        <button onClick={loadStats}
          title="Refresh all data"
          className="p-3 rounded-2xl glass-editorial shadow-ambient hover:scale-110 transition-all border border-[#e0c0b1]/30">
          <RefreshCw size={18} className="text-[#f97316]" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 glass-editorial p-2 rounded-[2rem] shadow-ambient overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === t.id
                ? 'gradient-sunset text-white shadow-ambient scale-[1.05]'
                : 'text-[#8c7164] hover:text-[#251913] hover:bg-[#251913]/5'
              }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          statsLoading ? <Loader label="stats" /> :
            statsError ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-red-500 text-sm">Failed to load stats. Make sure backend is running on port 8080.</p>
                <button onClick={loadStats}
                   className="px-4 py-2 text-sm font-semibold bg-[#f97316] text-white rounded-xl hover:bg-[#ea6b0e] transition-colors">
                  Retry
                </button>
              </div>
            ) :
              stats ? <OverviewTab stats={stats} onRetry={loadStats} /> : null
        )}
        {activeTab === 'users'           && <UsersTab />}
        {activeTab === 'owners'          && <OwnersTab />}
        {activeTab === 'listings'        && <ListingsTab />}
        {activeTab === 'bookings'        && <BookingsTab />}
        {activeTab === 'payouts'         && <PayoutsTab payoutTrigger={payoutTrigger} onPayoutAltered={handlePayoutAltered} />}
        {activeTab === 'ledger'          && <LedgerTab payoutTrigger={payoutTrigger} />}
        {activeTab === 'payout-accounts' && <PayoutAccountsTab onPayoutAltered={handlePayoutAltered} />}
        {activeTab === 'audit'           && <AuditLogTab />}
      </div>

    </div>
  );
}
