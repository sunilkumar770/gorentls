// src/components/ui/Button.tsx
import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient'
type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  asChild?: boolean
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:   'bg-brand-600 hover:bg-brand-700 active:bg-brand-700 text-text-inverse focus-visible:ring-brand-500',
  secondary: 'bg-surface-base border border-border-subtle hover:bg-surface-subtle text-text-primary focus-visible:ring-brand-500',
  outline:   'bg-transparent border border-border-default hover:bg-surface-subtle text-text-secondary hover:text-text-primary focus-visible:ring-brand-500',
  ghost:     'bg-transparent hover:bg-surface-subtle text-text-secondary hover:text-text-primary focus-visible:ring-brand-500',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-700 text-white focus-visible:ring-red-500',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500',
  gradient:  'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-text-inverse shadow-lg shadow-brand-500/20 focus-visible:ring-brand-500',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm:   'h-8  px-3   text-xs  gap-1.5 rounded-md',
  md:   'h-10 px-4   text-sm  gap-2   rounded-lg',
  lg:   'h-12 px-5   text-sm  gap-2.5 rounded-lg',
  icon: 'h-10 w-10  p-0      rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    asChild = false,
    disabled,
    className,
    children,
    ...props
  }, ref) => {
    const Component = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    return (
      <Component
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-semibold shrink-0',
          'transition-colors duration-normal',
          // Focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-surface-base',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant + size
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size === 'sm' ? 14 : 16} className="shrink-0 mr-2" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Component>
    )
  }
)
Button.displayName = 'Button'

function Spinner({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width={size} height={size}
      fill="none" viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
