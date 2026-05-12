// src/components/ui/Typography.tsx — canonical text styles
import { cn } from '@/lib/utils'

type TypographyVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' 
  | 'body-lg' | 'body-md' | 'body-sm' | 'body-xs'
  | 'label' | 'code'

interface TypographyProps {
  variant?: TypographyVariant
  as?: React.ElementType
  className?: string
  children: React.ReactNode
}

const VARIANT_STYLES: Record<TypographyVariant, string> = {
  h1: 'text-3xl sm:text-4xl font-bold tracking-tight text-text-primary font-display',
  h2: 'text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-display',
  h3: 'text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-display',
  h4: 'text-lg sm:text-xl font-bold tracking-tight text-text-primary font-display',
  
  'body-lg': 'text-lg leading-relaxed text-text-secondary font-sans',
  'body-md': 'text-base leading-relaxed text-text-secondary font-sans',
  'body-sm': 'text-sm leading-normal text-text-secondary font-sans',
  'body-xs': 'text-xs leading-normal text-text-tertiary font-sans',

  label: 'text-xs font-semibold tracking-wide uppercase text-text-tertiary font-sans',
  code:  'font-mono text-sm bg-surface-raised px-1.5 py-0.5 rounded text-brand-600',
}

const DEFAULT_ELEMENT: Record<TypographyVariant, React.ElementType> = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4',
  'body-lg': 'p', 'body-md': 'p', 'body-sm': 'p', 'body-xs': 'p',
  label: 'span', code: 'code',
}

export function Typography({
  variant = 'body-md',
  as,
  className,
  children
}: TypographyProps) {
  const Component = as ?? DEFAULT_ELEMENT[variant]

  return (
    <Component className={cn(VARIANT_STYLES[variant], className)}>
      {children}
    </Component>
  )
}

// Shorthand components
export function H1({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Typography variant="h1" className={className}>{children}</Typography>
}

export function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Typography variant="h2" className={className}>{children}</Typography>
}

export function H3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Typography variant="h3" className={className}>{children}</Typography>
}

export function Body({ 
  children, 
  className, 
  subtle,
  variant
}: { 
  children: React.ReactNode; 
  className?: string; 
  subtle?: boolean;
  variant?: 'body-lg' | 'body-md' | 'body-sm' | 'body-xs'
}) {
  const defaultVariant = subtle ? 'body-sm' : 'body-md'
  return (
    <Typography 
      variant={variant ?? defaultVariant} 
      className={cn(subtle && 'text-text-tertiary', className)}
    >
      {children}
    </Typography>
  )
}

export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Typography variant="body-xs" className={className}>{children}</Typography>
}
