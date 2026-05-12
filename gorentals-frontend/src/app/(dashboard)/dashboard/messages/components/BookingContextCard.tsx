import Link from 'next/link'

interface Props {
  itemName: string
  itemImageUrl?: string
  bookingId: string
  itemId: string
}

export function BookingContextCard({ itemName, itemImageUrl, bookingId, itemId }: Props) {
  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 shadow-sm">
        {itemImageUrl ? (
          <img src={itemImageUrl} alt={itemName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rental discussion</p>
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{itemName}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href={`/listings/${itemId}`}
          className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
        >
          View listing
        </Link>
      </div>
    </div>
  )
}
