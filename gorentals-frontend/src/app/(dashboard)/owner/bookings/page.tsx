'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader2, Check, X, Clock, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function OwnerBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'past'>('pending')

  const fetchBookings = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('gorentals_token='))?.split('=')[1]
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/bookings/owner/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.content || data || [])
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
      const url = action === 'CONFIRMED'
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/bookings/${bookingId}/confirm`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/bookings/${bookingId}/reject`

      const res = await fetch(url, {
        method: 'POST',
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isExpired = (b: any) => {
    const isPend = b.status === 'PENDING' || b.status === 'PENDING_PAYMENT'
    if (!isPend) return false
    if (!b.startDate) return true
    const start = new Date(b.startDate)
    start.setHours(0, 0, 0, 0)
    return start < today
  }

  const pendingList = bookings.filter((b: any) => {
    const isPend = b.status === 'PENDING' || b.status === 'PENDING_PAYMENT'
    if (!isPend) return false
    return !isExpired(b)
  })

  const upcomingList = bookings.filter((b: any) => {
    return b.status === 'CONFIRMED' || b.status === 'IN_USE' || b.status === 'RETURNED'
  })

  const pastList = bookings.filter((b: any) => {
    const isPastStatus = b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'NO_SHOW' || b.status === 'DISPUTED'
    return isPastStatus || isExpired(b)
  })

  const currentList = 
    activeTab === 'pending' ? pendingList :
    activeTab === 'upcoming' ? upcomingList :
    pastList

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-normal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Manage Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Review, approve, and track bookings for your rental listings
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Active Requests
          {pendingList.length > 0 && (
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Ongoing & Confirmed
          {upcomingList.length > 0 && (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {upcomingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-4 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'past'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          History & Expired
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium uppercase tracking-widest">Syncing with backend...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16">
          <EmptyState
            icon={activeTab === 'pending' ? '📥' : activeTab === 'upcoming' ? '🗓️' : '📋'}
            title={
              activeTab === 'pending' ? 'No active requests' :
              activeTab === 'upcoming' ? 'No ongoing bookings' :
              'No past bookings'
            }
            description={
              activeTab === 'pending' ? 'When renters book your items, active requests will show up here.' :
              activeTab === 'upcoming' ? 'Confirmed and active rentals will be listed here.' :
              'Your completed, cancelled, and expired booking requests will appear in your history.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {currentList.map((booking: any) => {
            const expired = isExpired(booking)
            return (
              <div 
                key={booking.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-3xl border transition-all p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-6 ${
                  booking.status === 'PENDING' && !expired
                    ? 'border-indigo-200 shadow-lg shadow-indigo-500/5 bg-indigo-50/5' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Item Info */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                    {booking.listing?.images?.[0] ? (
                      <img src={booking.listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        expired ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        booking.status === 'IN_USE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {expired ? 'EXPIRED' : booking.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ID: {booking.id.slice(0, 8)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">
                      {booking.listing?.title || 'Unknown Item'}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Renter & Price */}
                <div className="grid grid-cols-2 sm:flex sm:flex-col justify-between sm:justify-center items-start gap-4 px-0 sm:px-6 sm:border-x border-slate-100 dark:border-slate-800 shrink-0 min-w-[140px]">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Renter</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {booking.renter?.fullName || 'Customer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Earnings</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{booking.totalAmount?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  {booking.status === 'PENDING' && !expired ? (
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
                  ) : expired ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Date Passed
                    </div>
                  ) : (
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-xs font-bold px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-not-allowed">
                      {booking.status === 'CANCELLED' ? <X className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                      {booking.status === 'CANCELLED' ? 'Cancelled' : booking.status === 'COMPLETED' ? 'Completed' : 'View Details'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
