'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-[var(--text)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-[var(--bg)] border border-[var(--border)] rounded-[var(--r-md)] px-4 py-3 text-[var(--text)] placeholder:text-[#9b9b93]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:bg-[var(--bg-card)]',
              'transition-all duration-300',
              icon && 'pl-11',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export { Input };
