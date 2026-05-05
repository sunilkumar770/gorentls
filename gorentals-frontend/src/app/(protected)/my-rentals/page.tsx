'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { getMyBookings, triggerReceiptDownload, cancelBooking } from '@/services/bookings';
import type { Booking, BookingStatus } from '@/types';
import { 
  Calendar, MapPin, IndianRupee, Clock, XCircle, CheckCircle2, 
  Package, Check, AlertCircle, Heart, History, LayoutDashboard,
  Download, ArrowRight, Star, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

type TabType = 'bookings' | 'favorites';

export default function MyRentalsPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading, removeFavorite } = useFavorites();
  
  const [activeTab, setActiveTab] = useState<TabType>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadBookings();
    }
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const data = await getMyBookings();
      // Sort by creation date descending
      setBookings(data.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      setCancellingId(id);
      await cancelBooking(id);
      toast.success('Booking cancelled');
      await loadBookings();
    } catch (err) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadReceipt = async (id: string) => {
    try {
      setDownloadingId(id);
      await triggerReceiptDownload(id);
      toast.success('Receipt download started');
    } catch (err) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemoveFavorite = async (listingId: string) => {
    const success = await removeFavorite(listingId);
    if (success) toast.success('Removed from favorites');
    else toast.error('Failed to remove favorite');
  };

  // Filter bookings into active and history
  const { activeBookings, bookingHistory } = useMemo(() => {
    const active: Booking[] = [];
    const history: Booking[] = [];
    
    bookings.forEach(b => {
      if (['PENDING_PAYMENT', 'CONFIRMED', 'IN_USE'].includes(b.status)) {
        active.push(b);
      } else {
        history.push(b);
      }
    });
    
    return { activeBookings: active, bookingHistory: history };
  }, [bookings]);

  const getStatusStyle = (status: BookingStatus) => {
    const styles: Record<string, { color: string, bg: string, icon: any, label: string }> = {
      PENDING_PAYMENT: { color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock, label: 'Pending Payment' },
      CONFIRMED: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Confirmed' },
      IN_USE: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Package, label: 'In Use' },
      RETURNED: { color: 'text-slate-700', bg: 'bg-slate-50', icon: CheckCircle2, label: 'Returned' },
      COMPLETED: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: Check, label: 'Completed' },
      CANCELLED: { color: 'text-slate-500', bg: 'bg-slate-50', icon: XCircle, label: 'Cancelled' },
      DISPUTED: { color: 'text-rose-700', bg: 'bg-rose-50', icon: AlertCircle, label: 'Disputed' },
    };
    return styles[status] || { color: 'text-slate-500', bg: 'bg-slate-50', icon: Clock, label: status };
  };

  if (authLoading) return <div className="p-10 text-center">Loading session...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight">My Rentals</h1>
        <p className="text-[#64748b] mt-2 text-lg">Manage your active rentals, history, and favorites all in one place.</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 w-fit">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'bookings' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Bookings
          {activeBookings.length > 0 && (
            <span className="ml-1 bg-[#16a34a] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              {activeBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'favorites' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          <Heart className="w-4 h-4" />
          Favorites
          {favorites.length > 0 && (
            <span className="ml-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'bookings' && (
          <div className="space-y-12">
            {/* Active Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#16a34a]" />
                <h2 className="text-xl font-bold text-[#0f172a]">Active Rentals</h2>
              </div>
              
              {loadingBookings ? (
                <div className="grid gap-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
              ) : activeBookings.length === 0 ? (
                <EmptyState 
                  title="No active rentals" 
                  desc="You don't have any ongoing or pending rental requests." 
                  icon={<Package className="w-8 h-8" />}
                  action={{ label: 'Browse Gear', href: '/search' }}
                />
              ) : (
                <div className="grid gap-6">
                  {activeBookings.map(b => (
                    <BookingCard 
                      key={b.id} 
                      booking={b} 
                      status={getStatusStyle(b.status)}
                      onCancel={() => handleCancel(b.id)}
                      cancelling={cancellingId === b.id}
                      onDownload={() => handleDownloadReceipt(b.id)}
                      downloading={downloadingId === b.id}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* History Section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-[#64748b]" />
                <h2 className="text-xl font-bold text-[#0f172a]">Rental History</h2>
              </div>
              
              {loadingBookings ? (
                <div className="grid gap-4">
                  {[1].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-dashed border-slate-200">
                  No past rentals to show.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {bookingHistory.map(b => (
                    <HistoryRow 
                      key={b.id} 
                      booking={b} 
                      status={getStatusStyle(b.status)}
                      onDownload={() => handleDownloadReceipt(b.id)}
                      downloading={downloadingId === b.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-bold text-[#0f172a]">Saved Gear</h2>
            </div>

            {favLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
              </div>
            ) : favorites.length === 0 ? (
              <EmptyState 
                title="Your wishlist is empty" 
                desc="Save items you like to keep track of them for later." 
                icon={<Heart className="w-8 h-8" />}
                action={{ label: 'Explore Gear', href: '/search' }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(f => (
                  <FavoriteCard 
                    key={f.id} 
                    fav={f} 
                    onRemove={() => handleRemoveFavorite(f.listing.id)} 
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────────────

function BookingCard({ booking, status, onCancel, cancelling, onDownload, downloading }: any) {
  const StatusIcon = status.icon;
  const image = booking.listing?.listing_images?.[0]?.image_url || booking.listing?.images?.[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56 h-40 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
          {image ? (
            <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300"><Package /></div>
          )}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color} shadow-sm border border-white/20`}>
            {status.label}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link href={`/listing/${booking.listing?.id}`} className="text-xl font-bold text-[#0f172a] hover:text-[#16a34a] transition-colors line-clamp-1">
                {booking.listing?.title}
              </Link>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">TOTAL PAID</p>
                <p className="text-lg font-black text-[#0f172a]">₹{booking.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duration</p>
                <div className="flex items-center text-sm font-semibold text-[#334155]">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#16a34a]" />
                  {format(new Date(booking.startDate), 'MMM d')} - {format(new Date(booking.endDate), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location</p>
                <div className="flex items-center text-sm font-semibold text-[#334155]">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#16a34a]" />
                  {booking.listing?.city || 'Goa, India'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-50">
            {booking.status === 'PENDING_PAYMENT' && (
              <Link href={`/checkout/${booking.id}`} className="px-5 py-2.5 bg-[#16a34a] text-white text-sm font-bold rounded-xl hover:bg-[#15803d] shadow-sm transition-all">
                Complete Payment
              </Link>
            )}
            {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
              <button 
                onClick={onDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white text-sm font-bold rounded-xl hover:bg-[#1e293b] shadow-sm transition-all disabled:opacity-50"
              >
                {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                Download Receipt
              </button>
            )}
            {booking.status === 'PENDING_PAYMENT' && (
              <button 
                onClick={onCancel}
                disabled={cancelling}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}
            <Link href={`/messages?bookingId=${booking.id}`} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
              Chat with Owner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ booking, status, onDownload, downloading }: any) {
  return (
    <div className="flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${status.bg} ${status.color}`}>
          <status.icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-[#0f172a] truncate">{booking.listing?.title}</h4>
          <p className="text-xs text-slate-400">
            {format(new Date(booking.startDate), 'MMM d, yyyy')} · ₹{booking.totalAmount}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <span className={`hidden md:block text-[10px] font-black uppercase tracking-wider ${status.color}`}>
          {status.label}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={onDownload}
            disabled={downloading}
            title="Download Receipt"
            className="p-2 text-slate-400 hover:text-[#0f172a] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
          >
            {downloading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <Link 
            href={`/listing/${booking.listing?.id}`}
            title="View Item"
            className="p-2 text-slate-400 hover:text-[#16a34a] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FavoriteCard({ fav, onRemove }: any) {
  const listing = fav.listing;
  const image = listing?.listing_images?.[0]?.image_url || listing?.images?.[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        {image ? (
          <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-10 h-10" /></div>
        )}
        <button 
          onClick={onRemove}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur shadow-sm rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#16a34a] shadow-sm">
            ₹{listing.pricePerDay}/day
          </div>
        </div>
      </div>
      <div className="p-5">
        <Link href={`/listing/${listing.id}`} className="block">
          <h3 className="text-lg font-bold text-[#0f172a] hover:text-[#16a34a] transition-colors line-clamp-1 mb-1">
            {listing.title}
          </h3>
          <div className="flex items-center text-sm text-slate-400">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {listing.city || 'Goa, India'}
          </div>
        </Link>
        
        <Link 
          href={`/listing/${listing.id}`}
          className="mt-6 w-full py-3 bg-slate-50 text-[#0f172a] font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-[#16a34a] hover:text-white transition-all"
        >
          Check Availability
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ title, desc, icon, action }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-16 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#0f172a] mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-8">{desc}</p>
      {action && (
        <Link 
          href={action.href}
          className="inline-flex items-center justify-center px-8 py-3 bg-[#0f172a] text-white font-bold rounded-xl hover:bg-[#1e293b] transition-all shadow-lg shadow-slate-200"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
