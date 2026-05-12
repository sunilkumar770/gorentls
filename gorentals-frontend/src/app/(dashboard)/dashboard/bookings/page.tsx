'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '../../components/EmptyState'
import { BookingCard } from '../../components/BookingCard'
import { Loader2, Calendar, Filter } from 'lucide-react'

import { useRouter } from 'next/navigation'

export default function RenterBookingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, UPCOMING, COMPLETED, CANCELLED

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?from=/dashboard/bookings')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('gorentals_token='))?.split('=')[1]
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/bookings?userId=${user?.id}`, {
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
    if (user) fetchBookings()
  }, [user])

  const filteredBookings = bookings.filter((b: any) => {
    if (filter === 'ALL') return true
    if (filter === 'UPCOMING') return ['PENDING', 'CONFIRMED'].includes(b.bookingStatus)
    if (filter === 'COMPLETED') return b.bookingStatus === 'COMPLETED'
    if (filter === 'CANCELLED') return b.bookingStatus === 'CANCELLED'
    return true
  })

  if (authLoading || (isLoading && user)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading your bookings...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Your Bookings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your rental requests and history
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {['ALL', 'UPCOMING', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12">
          <EmptyState
            icon="📅"
            title="No bookings found"
            description={filter === 'ALL' ? "You haven't booked anything yet." : `No ${filter.toLowerCase()} bookings found.`}
            cta={filter === 'ALL' ? { label: 'Explore Gear', href: '/search' } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}
