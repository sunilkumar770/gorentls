'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

function PaymentSuccessContent() {
  const params = useSearchParams();
  const status = params.get('status') || 'success';
  const bookingId = params.get('bookingId') || '';
  const amount = params.get('amount') || '';
  const title = params.get('title') || 'Your rental item';
  const dates = params.get('dates') || '';

  const isSuccess = status !== 'failed';

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      {/* Minimal navbar */}
      <nav className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#111827]">
            <span className="w-7 h-7 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-xs font-black">G</span>
            GoRentals
          </Link>
        </div>
      </nav>

      {/* Confetti-style background dots (CSS) */}
      {isSuccess && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-20"
              style={{
                background: i % 3 === 0 ? '#16a34a' : i % 3 === 1 ? '#f59e0b' : '#3b82f6',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `scale(${0.5 + Math.random()})`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {isSuccess ? (
          <>
            {/* Green check circle */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#f0fdf4] rounded-full flex items-center justify-center ring-8 ring-[#f0fdf4]">
                <CheckCircle className="w-14 h-14 text-[#16a34a]" />
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full ring-4 ring-[#16a34a]/20 animate-ping" />
            </div>

            <h1 className="text-4xl font-bold text-[#111827] text-center mb-2">Payment Successful!</h1>
            <p className="text-[#6b7280] text-lg text-center mb-8">Your booking has been confirmed.</p>

            {/* Booking summary card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#f0fdf4] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="font-semibold text-[#111827]">{decodeURIComponent(title)}</p>
                  {dates && <p className="text-sm text-[#6b7280]">{decodeURIComponent(dates)}</p>}
                </div>
              </div>

              <div className="border-t border-[#f3f4f6] pt-4 flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Total paid</span>
                <span className="font-bold text-[#16a34a] text-lg">
                  {amount ? `₹${amount}` : 'Paid'}
                </span>
              </div>

              {bookingId && (
                <p className="text-xs text-[#9ca3af] text-center">
                  Booking ID: {bookingId}
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="w-full max-w-md flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-xl flex items-center justify-center hover:bg-[#15803d] transition-colors"
              >
                View My Bookings
              </Link>
              <Link
                href="/search"
                className="w-full h-11 border border-[#16a34a] text-[#16a34a] font-semibold rounded-xl flex items-center justify-center hover:bg-[#f0fdf4] transition-colors"
              >
                Continue Browsing
              </Link>
            </div>

            {/* Trust */}
            <p className="mt-6 text-xs text-[#9ca3af] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Your payment is secured by GoRentals
            </p>
          </>
        ) : (
          /* Failure state */
          <>
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center ring-8 ring-red-50 mb-6">
              <XCircle className="w-14 h-14 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold text-[#111827] text-center mb-2">Payment Failed</h1>
            <p className="text-[#6b7280] text-lg text-center mb-8">
              Something went wrong. Your card was not charged.
            </p>
            <div className="w-full max-w-md flex flex-col gap-3">
              <button
                onClick={() => window.history.back()}
                className="w-full h-12 bg-[#16a34a] text-white font-semibold rounded-xl flex items-center justify-center hover:bg-[#15803d] transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/help"
                className="w-full h-11 border border-[#e5e7eb] text-[#6b7280] font-semibold rounded-xl flex items-center justify-center hover:bg-[#f9fafb] transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </>
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
