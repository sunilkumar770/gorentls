'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Production-grade ErrorBoundary for GoRentals.
 *
 * Catches any uncaught render/lifecycle errors in the React tree below it
 * and displays a branded recovery screen instead of a white-screen crash.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production you would ship this to an error-tracking service
    // e.g. Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Error icon */}
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-5 ring-1 ring-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-slate-400 text-sm mb-1">
                This component crashed unexpectedly.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-red-400/70 text-xs font-mono bg-slate-800/50 rounded-lg p-3 mt-2 mb-4 text-left w-full break-all">
                  {this.state.error.message}
                </p>
              )}

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 text-sm font-medium border border-emerald-500/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all duration-200 text-sm font-medium border border-slate-600/30"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
