// src/components/ui/EmptyState.tsx
import { Button } from './Button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: string | React.ReactNode
  title: string
  description: string
  cta?: {
    label: string
    href?: string
    onClick?: () => void
    variant?: 'primary' | 'secondary'
  }
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon, title, description, cta, action, size = 'md'
}: EmptyStateProps) {
  const padding = size === 'sm' ? 'py-8' : size === 'md' ? 'py-12' : 'py-16'
  const iconSize = size === 'sm' ? 'text-3xl mb-2' : 'text-4xl mb-3'

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border-subtle ${padding} px-6 w-full`}
      role="status"
    >
      <span className={iconSize} aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-xs leading-relaxed">{description}</p>
      
      {/* Pre-defined CTA */}
      {cta && (
        <div className="mt-4">
          {cta.href ? (
            <Link href={cta.href}>
              <Button variant={cta.variant ?? 'primary'} size="sm">{cta.label}</Button>
            </Link>
          ) : (
            <Button variant={cta.variant ?? 'primary'} size="sm" onClick={cta.onClick}>
              {cta.label}
            </Button>
          )}
        </div>
      )}

      {/* Custom Action (Slot) */}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

