'use client'

import { Sun, Monitor, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light' as const, icon: Sun,     label: 'Light mode'  },
    { value: 'system' as const, icon: Monitor, label: 'System mode' },
    { value: 'dark'  as const, icon: Moon,    label: 'Dark mode'   },
  ]

  return (
    <div className="
      flex items-center gap-0.5 p-1 rounded-full
      bg-muted border border-border
    ">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={`
            p-1.5 rounded-full transition-all duration-200
            ${theme === value
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}

