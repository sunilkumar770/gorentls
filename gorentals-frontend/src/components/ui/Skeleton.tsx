// src/components/ui/Skeleton.tsx — replaces all animate-pulse divs
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'block' | 'circle'
  lines?: number
}

export function Skeleton({ className, variant = 'block', lines }: SkeletonProps) {
  if (variant === 'text' && lines) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading...">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-surface-raised rounded-md h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full',
              className
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        'animate-pulse bg-surface-raised',
        variant === 'circle' ? 'rounded-full' : 'rounded-lg',
        className
      )}
    />
  )
}

// Pre-built composites for common dashboard patterns
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-base p-5 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}

export function BookingCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-base">
      <Skeleton variant="block" className="w-14 h-14 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-base p-5 space-y-2">
      <Skeleton className="h-7 w-12" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}
