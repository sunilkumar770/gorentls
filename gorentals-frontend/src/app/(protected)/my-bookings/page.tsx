'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Booking } from '@/types';
import { getMyBookings, cancelBooking } from '@/services/bookings';
import { Calendar, MapPin, IndianRupee, Clock, XCircle, CheckCircle2, Package, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadBookings();
    }
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getMyBookings();
      // Sort by creation date descending
      setBookings(data.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setCancellingId(bookingId);
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      await loadBookings(); // Reload to get updated status
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string; bg: string }> = {
      PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, label: 'Pending Approval' },
      ACCEPTED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Accepted' },
      CONFIRMED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Confirmed' },
      REJECTED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Rejected' },
      CANCELLED: { color: 'text-gray-500', bg: 'bg-gray-50', icon: XCircle, label: 'Cancelled' },
      IN_PROGRESS: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Package, label: 'In Progress' },
      COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', icon: Check, label: 'Completed' },
      RETURNED: { color: 'text-gray-600', bg: 'bg-gray-50', icon: CheckCircle2, label: 'Returned' },
    };
    return config[status] || { color: 'text-gray-500', bg: 'bg-gray-50', icon: AlertCircle, label: status };
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-[#111827] mb-8">My Bookings</h1>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e5e7eb] p-6 flex flex-col md:flex-row gap-6">
              <Skeleton className="w-full md:w-48 h-32 rounded-xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="w-3/4 h-6" />
                <Skeleton className="w-1/2 h-4" />
                <Skeleton className="w-1/3 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">My Bookings</h1>
          <p className="text-[#6b7280] mt-1">Manage your rental requests and history</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-12 text-center">
          <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-[#9ca3af]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827] mb-2">No bookings yet</h3>
          <p className="text-[#6b7280] mb-6">You haven't requested any items to rent.</p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent font-medium rounded-xl text-white bg-[#16a34a] hover:bg-[#15803d]"
          >
            Start Exploring
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status);
            const StatusIcon = statusConfig.icon;
            const item = booking.listing;
            
            return (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] overflow-hidden transition-all hover:shadow-md">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    <div className="w-full md:w-56 h-40 bg-[#f3f4f6] rounded-xl overflow-hidden flex-shrink-0 relative">
                      {item?.listing_images && item.listing_images.length > 0 ? (
                         <img
                          src={item.listing_images[0].image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9ca3af]">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      
                      {/* Status Badge positioned over image on mobile, top right on desktop */}
                      <div className={`absolute top-3 right-3 md:hidden inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/listing/${booking.listing?.id}`} className="text-xl font-bold text-[#111827] hover:text-[#16a34a] hover:underline line-clamp-1">
                              {item?.title || 'Unknown Item'}
                            </Link>
                            <div className="flex items-center mt-2 text-sm text-[#6b7280]">
                              <MapPin className="w-4 h-4 mr-1 text-[#9ca3af]" />
                              {item?.city || 'Location unavailable'}
                            </div>
                          </div>
                          
                          {/* Desktop Status Badge */}
                          <div className={`hidden md:inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4 mr-1.5" />
                            {statusConfig.label}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-[#f9fafb] p-3 rounded-lg">
                            <span className="text-[#6b7280] block text-xs mb-1">Duration</span>
                            <div className="font-medium text-[#111827] flex items-center">
                              <Calendar className="w-4 h-4 mr-1.5 text-[#16a34a]" />
                              {format(new Date(booking.checkInDate || booking.createdAt), 'MMM d, yyyy')} - {format(new Date(booking.checkOutDate || booking.createdAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="bg-[#f9fafb] p-3 rounded-lg">
                            <span className="text-[#6b7280] block text-xs mb-1">Total Amount</span>
                            <div className="font-medium text-[#111827] flex items-center">
                              <IndianRupee className="w-4 h-4 mr-1 text-[#16a34a]" />
                              {booking.totalAmount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="bg-[#f9fafb] px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between">
                  <div className="text-sm text-[#6b7280]">
                    Booking ID: <span className="font-mono text-[#374151]">{booking.id.substring(0, 8)}...</span>
                  </div>
                  
                  <div className="flex gap-3">
                    {(booking.status === 'PENDING' || booking.status === 'ACCEPTED') && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="inline-flex items-center justify-center px-4 py-2 border border-[#d1d5db] font-medium rounded-lg text-sm text-[#374151] bg-white hover:bg-[#f9fafb] hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#111827] border-t-transparent mr-2"></div>
                            Cancelling...
                          </>
                        ) : 'Cancel Request'}
                      </button>
                    )}
                    
                    <Link
                      href={`/listing/${booking.listing?.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 font-medium rounded-lg text-sm text-[#16a34a] bg-[#f0fdf4] hover:bg-[#dcfce7] transition-colors"
                    >
                      View Listing
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
