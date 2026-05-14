// src/components/ui/Input.tsx
import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: InputSize
}

const SIZE_STYLES: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

const ICON_PADDING: Record<InputSize, { left: string; right: string }> = {
  sm: { left: 'pl-8', right: 'pr-8' },
  md: { left: 'pl-9', right: 'pr-9' },
  lg: { left: 'pl-10', right: 'pr-10' },
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, size = 'md', className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const hintId  = `${inputId}-hint`

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={cn(
              error ? errorId : undefined,
              hint  ? hintId  : undefined
            )}
            className={cn(
              // Base
              'w-full rounded-lg border bg-surface-subtle text-text-primary',
              'placeholder:text-text-muted',
              SIZE_STYLES[size],
              // Focus
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              'focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base',
              'transition-shadow duration-fast',
              // State
              error
                ? 'border-red-400 focus-visible:ring-red-400'
                : 'border-border-subtle hover:border-border-default',
              // Icons
              leftIcon  && ICON_PADDING[size].left,
              rightIcon && ICON_PADDING[size].right,
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-tertiary">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

