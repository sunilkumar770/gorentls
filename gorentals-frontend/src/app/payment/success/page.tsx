'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, Download, ArrowRight, Package, Calendar, IndianRupee } from 'lucide-react';
import { getBooking, triggerReceiptDownload } from '@/services/bookings';
import type { Booking } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

function PaymentSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get('bookingId') || '';
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      getBooking(bookingId)
        .then(setBooking)
        .catch(err => {
          console.error('Failed to load booking details:', err);
          toast.error('Failed to load booking details');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const handleDownloadReceipt = async () => {
    if (!bookingId) return;
    try {
      setDownloading(true);
      await triggerReceiptDownload(bookingId);
      toast.success('Receipt download started');
    } catch (err) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <nav className="bg-white border-b border-[#e2e8f0] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#0f172a]">
            <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm">G</div>
            GoRentals
          </Link>
          <Link href="/my-rentals" className="text-sm font-medium text-[#64748b] hover:text-[#16a34a] transition-colors">
            My Rentals
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 md:py-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#f0fdf4] px-8 py-10 text-center border-b border-emerald-50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mx-auto mb-6 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-12 h-12 text-[#16a34a]" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2">Payment Successful!</h1>
            <p className="text-[#15803d] font-medium">Your rental is now confirmed and secured in escrow.</p>
          </div>

          <div className="p-8 md:p-10">
            {booking ? (
              <div className="space-y-8">
                {/* Booking Summary */}
                <div className="flex gap-6 items-start pb-8 border-b border-slate-100">
                  <div className="w-28 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0">
                    {(booking.listing?.images?.[0] || booking.listing?.listing_images?.[0]?.image_url) ? (
                      <img 
                        src={booking.listing?.images?.[0] || booking.listing?.listing_images?.[0]?.image_url} 
                        alt={booking.listing?.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-[#0f172a] truncate">{booking.listing?.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                      <div className="flex items-center text-sm text-[#64748b]">
                        <Calendar className="w-4 h-4 mr-2 text-[#16a34a]" />
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-[#64748b]">
                        <IndianRupee className="w-4 h-4 mr-2 text-[#16a34a]" />
                        Total Paid: <span className="ml-1 font-bold text-[#0f172a]">₹{booking.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[#0f172a] text-white font-bold rounded-2xl hover:bg-[#1e293b] transition-all shadow-lg shadow-slate-200 disabled:opacity-70 group"
                  >
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                    Download Receipt
                  </button>
                  <Link
                    href="/my-rentals"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-[#e2e8f0] text-[#0f172a] font-bold rounded-2xl hover:border-[#16a34a] hover:text-[#16a34a] transition-all group"
                  >
                    Go to My Rentals
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-6">Booking details not available.</p>
                <Link href="/dashboard" className="text-[#16a34a] font-bold hover:underline">
                  Return to Dashboard
                </Link>
              </div>
            )}

            {/* Security Footnote */}
            <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 text-[#94a3b8] text-xs font-medium uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Secured Escrow Payment · GoRentals Trust & Safety
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Booking Reference: <span className="font-mono text-slate-500">{bookingId}</span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
