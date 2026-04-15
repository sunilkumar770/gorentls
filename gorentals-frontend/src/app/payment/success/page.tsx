'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Shield } from 'lucide-react';

function PaymentSuccessContent() {
  const params    = useSearchParams();
  const bookingId = params.get('bookingId') || '';

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <nav className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#111827]">
            <span className="w-7 h-7 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-xs font-black">G</span>
            GoRentals
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center ring-8 ring-amber-50 mb-6">
          <Shield className="w-14 h-14 text-amber-500" />
        </div>
        <h1 className="text-4xl font-bold text-[#111827] text-center mb-2">Payment Coming Soon</h1>
        <p className="text-[#6b7280] text-lg text-center mb-8 max-w-md">
          We are currently finalizing our payment integration. This feature will be live soon!
        </p>
        <div className="w-full max-w-md flex flex-col gap-3">
          <Link href="/dashboard"
                className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-xl flex items-center justify-center hover:bg-[#15803d] transition-colors">
            Back to Dashboard
          </Link>
          <Link href="/search"
                className="w-full h-11 border border-[#e5e7eb] text-[#6b7280] font-semibold rounded-xl flex items-center justify-center hover:bg-[#f9fafb] transition-colors">
            Continue Browsing
          </Link>
        </div>
        {bookingId && (
          <p className="mt-8 text-xs text-[#9ca3af]">
            Booking ID: <span className="font-mono">{bookingId}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
