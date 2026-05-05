'use client';

import { ShieldAlert, RotateCcw } from 'lucide-react';

export function ErrorFallback({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--r-xl)] shadow-sm border border-[#fee2e2] p-12 text-center shadow-card">
      <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-5">
        <ShieldAlert className="w-8 h-8 text-[#b91c1c]" />
      </div>
      <h3 className="font-display text-xl font-bold text-[var(--text)] mb-2">Interface Disruption</h3>
      <p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto">
        An unexpected error occurred while rendering this section: <br />
        <span className="text-xs font-mono bg-[var(--bg-subtle)] px-2 py-1 rounded mt-2 inline-block">
          {error.message}
        </span>
      </p>
      <button
        onClick={resetErrorBoundary}
        className="inline-flex h-12 items-center justify-center gap-2 px-8 bg-[#b91c1c] text-white text-sm font-bold rounded-[var(--r-md)] shadow-card hover:bg-[#991b1b] transition-all"
      >
        <RotateCcw className="w-4 h-4" /> Reset Interface
      </button>
    </div>
  );
}
