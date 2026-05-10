'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-[#0F766E]/20 flex items-center justify-center bg-transparent">
        <span className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl text-[#6b6b65] hover:text-[#1a1a18] hover:bg-black/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-card/10 transition-all border border-transparent hover:border-[#0F766E]/20 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/50"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
