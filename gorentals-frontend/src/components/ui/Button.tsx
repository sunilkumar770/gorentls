'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, asChild = false, disabled, children, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    
    const base = 'inline-flex items-center justify-center font-bold rounded-[var(--r-md)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-card hover:shadow-card-hover',
      gradient: 'gradient-teal text-white shadow-card hover:shadow-card-hover border-none',
      secondary: 'bg-[var(--bg-subtle)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)]',
      outline: 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)]',
      ghost: 'text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-base px-7 py-3.5 gap-2.5',
    };

    return (
      <Component
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {children}
          </>
        )}
      </Component>
    );
  }
);
Button.displayName = 'Button';
export { Button };
