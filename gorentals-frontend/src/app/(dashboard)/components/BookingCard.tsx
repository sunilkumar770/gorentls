'use client'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPCOMING:  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  PENDING:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function BookingCard({ booking }: { booking: any }) {
  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Link
      href={`/dashboard/bookings/${booking.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
    >
      {/* Item image */}
      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
        {booking.listing?.imageUrl ? (
          <img src={booking.listing.imageUrl} alt={booking.listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">📦</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {booking.listing?.title ?? 'Rental'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {startDate} – {endDate}
        </p>
      </div>

      {/* Status + price */}
      <div className="text-right shrink-0">
        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {booking.status}
        </span>
        <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
          ₹{booking.totalAmount?.toLocaleString('en-IN') ?? '—'}
        </p>
      </div>
    </Link>
  )
}
