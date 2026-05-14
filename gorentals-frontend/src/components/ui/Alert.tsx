// src/components/ui/Alert.tsx
import { cn } from '@/lib/utils'

type AlertVariant = 'success' | 'warning' | 'error' | 'info'

interface AlertProps {
  variant: AlertVariant
  title?: string
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

const VARIANT_STYLES: Record<AlertVariant, { wrapper: string; icon: string }> = {
  success: {
    wrapper: 'bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success-text)]',
    icon: 'text-[var(--status-success-text)]',
  },
  warning: {
    wrapper: 'bg-[var(--status-warning-bg)] border-[var(--status-warning-border)] text-[var(--status-warning-text)]',
    icon: 'text-[var(--status-warning-text)]',
  },
  error: {
    wrapper: 'bg-[var(--status-error-bg)] border-[var(--status-error-border)] text-[var(--status-error-text)]',
    icon: 'text-[var(--status-error-text)]',
  },
  info: {
    wrapper: 'bg-[var(--status-info-bg)] border-[var(--status-info-border)] text-[var(--status-info-text)]',
    icon: 'text-[var(--status-info-text)]',
  },
}

const DEFAULT_ICONS: Record<AlertVariant, string> = {
  success: '✓',
  warning: '⚠',
  error:   '✕',
  info:    'ℹ',
}

export function Alert({ variant, title, children, icon, className }: AlertProps) {
  const styles = VARIANT_STYLES[variant]
  const defaultIcon = DEFAULT_ICONS[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3.5',
        styles.wrapper,
        className
      )}
    >
      <span className={cn('text-sm shrink-0 mt-0.5 font-bold', styles.icon)} aria-hidden="true">
        {icon ?? defaultIcon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-0.5">{title}</p>
        )}
        <p className="text-sm leading-relaxed opacity-90">{children}</p>
      </div>
    </div>
  )
}

