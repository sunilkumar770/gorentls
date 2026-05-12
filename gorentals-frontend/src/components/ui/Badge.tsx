// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand'
type BadgeSize    = 'xs' | 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
  children: React.ReactNode
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-border)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)]',
  error:   'bg-[var(--status-error-bg)]   text-[var(--status-error-text)]   border border-[var(--status-error-border)]',
  info:    'bg-[var(--status-info-bg)]    text-[var(--status-info-text)]    border border-[var(--status-info-border)]',
  neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] border border-[var(--status-neutral-border)]',
  brand:   'bg-brand-50 text-brand-600 border border-brand-100',
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: 'bg-[var(--status-success-text)]',
  warning: 'bg-[var(--status-warning-text)]',
  error:   'bg-[var(--status-error-text)]',
  info:    'bg-[var(--status-info-text)]',
  neutral: 'bg-[var(--status-neutral-text)]',
  brand:   'bg-brand-600',
}

// Booking status → badge variant mapping
export const BOOKING_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE:    'success',
  CONFIRMED: 'info',
  UPCOMING:  'info',
  PENDING:   'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
  DISPUTED:  'error',
}

export function Badge({ variant = 'neutral', size = 'md', dot, className, children }: BadgeProps) {
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.25 leading-none',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap',
        sizeStyles[size],
        VARIANT_STYLES[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
