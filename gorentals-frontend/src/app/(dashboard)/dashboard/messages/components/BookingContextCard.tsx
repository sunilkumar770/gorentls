import Link from 'next/link'

interface Props {
  itemName: string
  itemImageUrl?: string
  bookingId: string
  itemId: string
}

export function BookingContextCard({ itemName, itemImageUrl, bookingId, itemId }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-subtle border-b border-border-subtle">
      {/* Item thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-raised border border-border-subtle shrink-0 flex items-center justify-center">
        {itemImageUrl ? (
          <img src={itemImageUrl} alt={itemName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">📦</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
          Rental discussion
        </p>
        <p className="text-sm font-semibold text-text-primary truncate">{itemName}</p>
      </div>

      {/* Link */}
      <Link
        href={`/listings/${itemId}`}
        className="text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0 transition-colors focus-ring rounded"
      >
        View listing
      </Link>
    </div>
  )
}
