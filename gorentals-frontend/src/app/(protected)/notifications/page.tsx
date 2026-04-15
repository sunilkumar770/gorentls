'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/services/notifications';
import api from '@/lib/axios';
import type { Notification }                from '@/types';
import {
  Bell, BellOff, CheckCheck, Trash2, BookCheck,
  Package, ShieldCheck, ShieldX, CreditCard,
  Wallet, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Type → icon + accent colour ─────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; colour: string; bg: string }> = {
  BOOKING_CONFIRMED: { Icon: BookCheck,   colour: '#16a34a', bg: '#dcfce7' },
  NEW_BOOKING:       { Icon: BookCheck,   colour: '#2563eb', bg: '#dbeafe' },
  LISTING_APPROVED:  { Icon: ShieldCheck, colour: '#16a34a', bg: '#dcfce7' },
  LISTING_REJECTED:  { Icon: ShieldX,     colour: '#dc2626', bg: '#fee2e2' },
  PAYMENT_CONFIRMED: { Icon: CreditCard,  colour: '#16a34a', bg: '#dcfce7' },
  PAYMENT_RECEIVED:  { Icon: Wallet,      colour: '#2563eb', bg: '#dbeafe' },
  PAYMENT_FAILED:    { Icon: AlertCircle, colour: '#dc2626', bg: '#fee2e2' },
  DEFAULT:           { Icon: Bell,        colour: '#6b7280', bg: '#f3f4f6' },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.DEFAULT;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-100 p-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <BellOff size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">No notifications yet</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        You&apos;ll see booking updates, payment confirmations, and listing activity here.
      </p>
    </div>
  );
}

// ─── Single card ─────────────────────────────────────────────────────────────

interface CardProps {
  n:         Notification;
  onRead:    (id: string) => void;
  onDelete:  (id: string) => void;
  busy:      string | null;
}

function NotificationCard({ n, onRead, onDelete, busy }: CardProps) {
  const { Icon, colour, bg } = getConfig(n.type);
  const isBusy = busy === n.id;

  return (
    <div
      className={`
        group flex items-start gap-4 rounded-xl border p-4 transition-all duration-150
        ${n.isRead
          ? 'bg-white border-gray-100 hover:border-gray-200'
          : 'bg-blue-50/40 border-blue-100 hover:border-blue-200'}
      `}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: bg }}
      >
        <Icon size={18} style={{ color: colour }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
            {n.title}
          </p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Mark read */}
            {!n.isRead && (
              <button
                onClick={() => onRead(n.id)}
                disabled={isBusy}
                title="Mark as read"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={15} />
              </button>
            )}
            {/* Delete */}
            <button
              onClick={() => onDelete(n.id)}
              disabled={isBusy}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
          {!n.isRead && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  onPrev:     () => void;
  onNext:     () => void;
}

function Pagination({ page, totalPages, total, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page {page + 1} of {totalPages} &middot; {total} notifications
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [page,          setPage]           = useState(0);
  const [totalPages,    setTotalPages]     = useState(0);
  const [totalElements, setTotalElements]  = useState(0);
  const [unread,        setUnread]         = useState(0);
  const [busy,          setBusy]           = useState<string | null>(null);
  const [markingAll,    setMarkingAll]     = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await getNotifications(p, 20);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (e) {
      console.error('Notifications load error:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await getUnreadCount());
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { load(0); refreshCount(); }, []);  // eslint-disable-line

  const handleRead = async (id: string) => {
    setBusy(id);
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) { console.error(e); }
    finally { setBusy(null); }
  };

  const handleDelete = async (id: string) => {
    setBusy(id);
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalElements(t => t - 1);
      await refreshCount();
    } catch (e) { console.error(e); }
    finally { setBusy(null); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) { console.error(e); }
    finally { setMarkingAll(false); }
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-gray-700" />
              Notifications
              {unread > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </h1>
            {totalElements > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {totalElements} notification{totalElements !== 1 ? 's' : ''}
                {unread > 0 && ` · ${unread} unread`}
              </p>
            )}
          </div>

          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600
                         border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50
                         transition-colors"
            >
              <CheckCheck size={15} />
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <Skeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <NotificationCard
                key={n.id}
                n={n}
                onRead={handleRead}
                onDelete={handleDelete}
                busy={busy}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="mt-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalElements}
              onPrev={() => load(page - 1)}
              onNext={() => load(page + 1)}
            />
          </div>
        )}

      </div>
    </div>
  );
}
