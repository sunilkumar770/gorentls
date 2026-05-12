'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '../../components/EmptyState'
import { Loader2, Check, X, Clock, Calendar, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function OwnerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('gorentals_token='))?.split('=')[1]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/bookings?ownerId=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchBookings()
  }, [user])

  const handleAction = async (bookingId: string, action: 'CONFIRMED' | 'CANCELLED') => {
    setProcessingId(bookingId)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('gorentals_token='))?.split('=')[1]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/bookings/${bookingId}/status?newStatus=${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success(action === 'CONFIRMED' ? 'Booking accepted!' : 'Booking declined')
        fetchBookings()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to update booking')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Manage Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Approve or decline rental requests from customers
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium uppercase tracking-widest">Syncing with backend...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16">
          <EmptyState
            icon="📥"
            title="No requests yet"
            description="When someone books your gear, their request will appear here for your approval."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking: any) => (
            <div 
              key={booking.id}
              className={`group relative bg-white dark:bg-slate-900 rounded-3xl border transition-all p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-6 ${
                booking.bookingStatus === 'PENDING' 
                  ? 'border-indigo-200 shadow-lg shadow-indigo-500/5 bg-indigo-50/10' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Item Info */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                  {booking.item?.images?.[0] ? (
                    <img src={booking.item.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                      booking.bookingStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      booking.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: {booking.id.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">
                    {booking.item?.name || 'Unknown Item'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Renter & Price */}
              <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-4 px-0 sm:px-6 sm:border-x border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Renter</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{booking.renterName || 'Customer'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Earnings</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {booking.bookingStatus === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleAction(booking.id, 'CONFIRMED')}
                      disabled={processingId === booking.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold px-6 py-3 rounded-2xl transition-all shadow-md shadow-indigo-500/10 active:scale-95"
                    >
                      {processingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'CANCELLED')}
                      disabled={processingId === booking.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-6 py-3 rounded-2xl transition-all active:scale-95"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-xs font-bold px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-not-allowed">
                    {booking.bookingStatus === 'CANCELLED' ? <X className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    {booking.bookingStatus === 'CANCELLED' ? 'Cancelled' : 'View Details'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
