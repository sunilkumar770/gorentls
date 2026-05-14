// src/components/ui/Card.tsx
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'raised' | 'bordered' | 'ghost'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:  'bg-surface-base border border-border-subtle shadow-sm',
  raised:   'bg-surface-base border border-border-subtle shadow-md',
  bordered: 'bg-surface-base border border-border-default',
  ghost:    'bg-transparent',
}

const PADDING_STYLES = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6 sm:p-8',
}

export function Card({
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
        VARIANT_STYLES[variant],
        PADDING_STYLES[padding],
        interactive && 'cursor-pointer hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-normal hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

