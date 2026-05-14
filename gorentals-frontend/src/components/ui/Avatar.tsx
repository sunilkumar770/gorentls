// src/components/ui/Avatar.tsx
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = { 
  xs: 'w-6 h-6 text-[10px]', 
  sm: 'w-8 h-8 text-xs', 
  md: 'w-10 h-10 text-sm', 
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl'
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center',
        'text-brand-600 dark:text-brand-300 font-bold overflow-hidden shrink-0',
        SIZE_MAP[size],
        className
      )}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  )
}

