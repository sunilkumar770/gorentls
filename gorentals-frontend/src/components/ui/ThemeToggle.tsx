'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) return (
    <div className="w-20 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
  )

  return (
    <div className="flex items-center p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-700 w-fit">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "relative p-1.5 rounded-full transition-all duration-300 group",
          theme === 'light' 
            ? "bg-white text-amber-500 shadow-sm" 
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
        )}
        aria-label="Light mode"
      >
        <Sun size={16} className={cn("relative z-10", theme === 'light' ? "scale-110" : "scale-100")} />
        {theme === 'light' && (
          <div className="absolute inset-0 bg-amber-500/10 blur-md rounded-full -z-0" />
        )}
      </button>

      <button
        onClick={() => setTheme('system')}
        className={cn(
          "relative p-1.5 rounded-full transition-all duration-300 group",
          theme === 'system' 
            ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm" 
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
        )}
        aria-label="System mode"
      >
        <Monitor size={16} className={cn("relative z-10", theme === 'system' ? "scale-110" : "scale-100")} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "relative p-1.5 rounded-full transition-all duration-300 group",
          theme === 'dark' 
            ? "bg-slate-900 text-indigo-400 shadow-sm" 
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
        )}
        aria-label="Dark mode"
      >
        <Moon size={16} className={cn("relative z-10", theme === 'dark' ? "scale-110" : "scale-100")} />
        {theme === 'dark' && (
          <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full -z-0" />
        )}
      </button>
    </div>
  )
}
