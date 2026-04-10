"use client";

import Link from 'next/link';
import { Compass, Home, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-4">
      {/* Visual Header */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-[#f0fdf4] rounded-full flex items-center justify-center ring-8 ring-[#f0fdf4]">
          <Compass className="w-16 h-16 text-[#16a34a]" />
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 -left-6 w-4 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute -bottom-2 -right-4 w-6 h-6 bg-[#16a34a] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 -right-10 w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      <h1 className="text-8xl font-black text-[#111827] tracking-tighter mb-2">404</h1>
      <h2 className="text-2xl font-bold text-[#374151] mb-4 text-center">Looks like you're off the map.</h2>
      <p className="text-[#6b7280] text-center max-w-md mb-10 leading-relaxed">
        The item, page, or storefront you're looking for doesn't exist or has been moved to a different location.
      </p>

      {/* Quick Nav Options */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#e5e7eb] hover:border-[#16a34a] hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-[#f0fdf4] rounded-xl flex items-center justify-center text-[#16a34a] group-hover:scale-110 transition-transform">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#111827]">Back Home</h3>
            <p className="text-xs text-[#6b7280]">Return to homepage</p>
          </div>
        </Link>

        <Link 
          href="/search" 
          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#e5e7eb] hover:border-[#16a34a] hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#111827]">Search Items</h3>
            <p className="text-xs text-[#6b7280]">Find what you need</p>
          </div>
        </Link>
      </div>

      {/* Footer support link */}
      <div className="mt-16 text-center">
        <Link href="/help" className="inline-flex items-center gap-2 text-sm text-[#9ca3af] hover:text-[#16a34a] transition-colors">
          <HelpCircle className="w-4 h-4" /> Need assistance? Visit our Help Center
        </Link>
      </div>
    </div>
  );
}
