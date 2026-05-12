import Link from 'next/link'
import Image from 'next/image'

interface Listing {
  id: string
  title: string
  images?: string[]
  pricePerDay: number
  location?: string
  category?: string
  condition?: string
  owner?: { fullName: string; isVerified?: boolean }
}

const CONDITION_STYLES: Record<string, string> = {
  'New':       'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Like New':  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Good':      'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Fair':      'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export function ListingCard({ item }: { item: Listing }) {
  const hasImage = item.images && item.images.length > 0
  const ownerInitial = item.owner?.fullName?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <Link
      href={`/listings/${item.id}`}
      className="group block rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {hasImage ? (
          <Image
            src={item.images![0]}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300 dark:text-slate-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">No photo available</span>
          </div>
        )}
        
        {/* Condition Badge */}
        {item.condition && (
          <span className={`absolute top-4 left-4 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-lg backdrop-blur-md ${CONDITION_STYLES[item.condition] ?? 'bg-white/90 text-slate-900'}`}>
            {item.condition}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm">📍</span>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.location || 'Hyderabad'}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              ₹{item.pricePerDay.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">/ day</span>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-black shrink-0">
            {ownerInitial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-none">
              {item.owner?.fullName || 'Local Owner'}
            </span>
            {item.owner?.isVerified && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5 uppercase tracking-tighter">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
