// src/components/ui/Logo.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  hideText?: boolean
}

const SIZE_MAP = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
}

export function Logo({ size = 'md', className, hideText = false }: LogoProps) {
  const { icon, text } = SIZE_MAP[size]

  return (
    <Link href="/" className={cn('flex items-center gap-2 group', className)}>
      <div 
        className={cn(
          'bg-brand-600 rounded-[28%] flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105',
        )}
        style={{ width: icon, height: icon }}
      >
        <svg
          width={icon * 0.6}
          height={icon * 0.6}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!hideText && (
        <span className={cn('font-bold text-text-primary tracking-tight font-display', text)}>
          GoRentals
        </span>
      )}
    </Link>
  )
}

export function LogoMark({ className, size = 32 }: { className?: string, size?: number }) {
  return (
    <div 
      className={cn(
        'bg-brand-600 rounded-[28%] flex items-center justify-center text-white font-bold',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

