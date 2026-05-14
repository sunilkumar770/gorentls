'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function OwnerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[OwnerDashboard] Render error caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-1 ring-amber-500/20">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Owner Panel Error</h2>
        <p className="text-slate-400 text-sm mb-6">
          Something went wrong loading the owner dashboard. Try refreshing — your listings and bookings are unaffected.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <p className="text-red-400/70 text-xs font-mono bg-slate-800/50 rounded-lg p-3 mb-5 text-left break-all">
            {error.message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-sm font-medium border border-slate-600/30"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
