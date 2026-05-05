'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { handleApiError } from '@/lib/apiError';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  User as UserIcon, 
  Calendar,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  HandHelping
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

interface OwnerBooking {
  id: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    pricePerDay: number;
    city: string;
  };
  renter: {
    fullName: string;
    email: string;
    phone: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  escrowStatus: string;
  totalAmount: number;
  advanceAmount: number;
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/owner/bookings');
      setBookings(response.data.content);
    } catch (error) {
      const message = handleApiError(error);
      if (process.env.NODE_ENV === "development") console.error('Fetch bookings failed:', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    setActionLoading(`${bookingId}-${action}`);
    try {
      await api.post(`/bookings/${bookingId}/${action}`);
      await fetchBookings();
    } catch (error) {
      const message = handleApiError(error);
      if (process.env.NODE_ENV === "development") console.error(`Action ${action} failed:`, message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, escrowStatus: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200">Pending Payment</Badge>;
      case 'CONFIRMED':
        if (escrowStatus === 'ADVANCE_HELD') {
          return <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">Ready for Handover</Badge>;
        }
        return <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>;
      case 'IN_USE':
        return <Badge variant="info" className="bg-blue-100 text-blue-700 border-blue-200">With Renter</Badge>;
      case 'RETURNED':
        return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Returned</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Booking <span className="text-emerald-600">Management</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Manage your rental requests, handovers, and track item status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <AlertCircle className="w-4 h-4 text-emerald-500" />
          <span>{bookings.length} Total Bookings</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No bookings yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            When users start booking your items, you'll see them listed here for management.
          </p>
          <Button variant="outline" className="rounded-full px-8" asChild>
            <Link href="/listings">View My Listings</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-sm font-semibold text-slate-600">Item Details</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-600">Renter Information</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-600">Rental Period</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-6 py-5 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                          <Image
                            src={booking.listing.images[0] || '/placeholder-item.jpg'}
                            alt={booking.listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight mb-0.5">{booking.listing.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <span className="text-emerald-600 font-bold">₹{booking.listing.pricePerDay}</span> / day
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm mb-0.5">{booking.renter.fullName}</span>
                        <span className="text-xs text-slate-500 font-medium">{booking.renter.email}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{booking.renter.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">
                            {format(new Date(booking.startDate), 'MMM d')} – {format(new Date(booking.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-9">
                          {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 3600 * 24))} Days Rental
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(booking.status, booking.escrowStatus)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Case 1: Booking is pending payment, owner can accept/reject the request */}
                        {booking.status === 'PENDING_PAYMENT' && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
                              onClick={() => handleAction(booking.id, 'confirm')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${booking.id}-confirm` ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleAction(booking.id, 'reject')}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === `${booking.id}-reject` ? (
                                <div className="w-4 h-4 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
                              ) : (
                                <><XCircle className="w-4 h-4 mr-1.5" /> Reject</>
                              )}
                            </Button>
                          </>
                        )}

                        {/* Case 2: Booking is confirmed and advance is paid, owner marks handover */}
                        {booking.status === 'CONFIRMED' && booking.escrowStatus === 'ADVANCE_HELD' && (
                          <Button
                            size="sm"
                            className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                            onClick={() => handleAction(booking.id, 'confirm')}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === `${booking.id}-confirm` ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <><HandHelping className="w-4 h-4 mr-1.5" /> Mark Handover</>
                            )}
                          </Button>
                        )}

                        {/* Fallback View Details */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full border-slate-200 text-slate-600"
                          asChild
                        >
                          <Link href={`/bookings/${booking.id}`}>
                            Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Payment Protection Note</h4>
          <p className="text-sm text-amber-800 leading-relaxed">
            Funds are held securely in escrow. When you <span className="font-bold">Accept</span> a request, the renter is notified to pay. 
            Once they pay the advance, the status moves to <span className="font-bold italic text-emerald-700">Ready for Handover</span>. 
            After you handover the item, click <span className="font-bold italic text-blue-700">Mark Handover</span> to proceed.
          </p>
        </div>
      </div>
    </div>
  );
}
