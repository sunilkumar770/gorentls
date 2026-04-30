'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RazorpayCheckout } from '@/components/payment/RazorpayCheckout';
import { useEscrow } from '@/hooks/useEscrow';
import { PriceBreakdown } from '@/components/bookings/PriceBreakdown';
import { getBooking } from '@/services/bookings';
import { Shield, MapPin, Calendar, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { calcQuotePhase1 } from '@/lib/pricing';

export default function CheckoutPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const router = useRouter();

  const [booking,  setBooking]  = useState<any | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const { escrow, refresh: refreshEscrow } = useEscrow(bookingId as string);

  // Load booking details
  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    getBooking(bookingId)
      .then(data => {
        setBooking(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Could not load booking details. Please try again.');
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-gray-700 font-semibold">{error ?? 'Booking not found.'}</p>
      <Link href="/my-bookings" className="text-[#16a34a] text-sm font-medium hover:underline">
        ← Back to bookings
      </Link>
    </div>
  );

  // Guard: block double payment
  if (booking.paymentStatus === 'COMPLETED' || booking.paymentStatus === 'PAID') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">✅</div>
      <h2 className="text-xl font-bold text-gray-900">Already paid</h2>
      <p className="text-gray-500 text-sm text-center max-w-xs">
        This booking has been fully paid. No further action needed.
      </p>
      <Link href="/my-bookings"
            className="px-6 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-xl
                       hover:bg-[#15803d] transition-colors">
        View My Bookings
      </Link>
    </div>
  );

  const image      = (booking.listing?.images?.[0] || booking.listing?.listing_images?.[0]?.image_url) ?? null;
  const startDate  = booking.startDate  ?? booking.checkInDate  ?? '';
  const endDate    = booking.endDate    ?? booking.checkOutDate ?? '';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <span className="w-7 h-7 bg-[#16a34a] rounded-lg flex items-center justify-center text-white text-xs font-black">G</span>
            GoRentals
          </Link>
          <button onClick={() => router.back()}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Confirm &amp; Pay</h1>

        {/* Listing summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="flex gap-4 p-5">
            <div className="w-24 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
              {image
                ? <img src={image} alt={booking.listing?.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{booking.listing?.title}</h3>
              {booking.listing?.city && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {booking.listing.city}
                </p>
              )}
              {startDate && endDate && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(startDate)} → {formatDate(endDate)}
                  <span className="ml-1 text-gray-400">
                    ({booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''})
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown — smart: uses backend gstAmount/platformFee if present (new bookings),
            falls back to Phase 1 recomputed values for legacy bookings without fee columns. */}
        {(() => {
          const hasServerBreakdown =
            booking.gstAmount   != null &&
            booking.platformFee != null;

          const lines = hasServerBreakdown
            ? [
                { label: 'Rental amount',     amount: booking.rentalAmount },
                { label: 'GST (18%)',         amount: booking.gstAmount! },
                { label: 'Platform fee (5%)', amount: booking.platformFee! },
                ...(booking.securityDeposit > 0
                  ? [{ label: 'Security deposit', amount: booking.securityDeposit, isNote: '(refundable)' }]
                  : []),
                { label: 'Total payable', amount: booking.totalAmount, isBold: true, isGreen: true },
              ]
            : calcQuotePhase1(booking.rentalAmount, booking.securityDeposit).breakdown;

          return <PriceBreakdown lines={lines} showNotice className="mb-4" />;
        })()}

        {/* Meta */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Owner</p>
              <p className="font-semibold text-gray-800">{booking.owner?.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Booking ref</p>
              <p className="font-mono text-xs text-gray-500 uppercase">{booking.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Real-time Escrow Status Display */}
        {escrow && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Escrow Status</p>
                <p className="text-sm text-emerald-900 font-semibold">{escrow.escrowStatus.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Collected</p>
                <p className="text-sm text-emerald-900 font-semibold">₹{escrow.totalCollected.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {(() => {
          if (!escrow) return null;
          
          // Terminal state: fully funded
          if (escrow.escrowStatus === 'FULL_HELD' || escrow.escrowStatus === 'RETURNED' || escrow.escrowStatus === 'PAID_OUT') {
            return (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Escrow Fully Funded</h3>
                <p className="text-gray-500 text-sm mb-6">The total booking amount has been successfully collected and is being held in escrow.</p>
                <Link href="/my-bookings" className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                  View My Bookings
                </Link>
              </div>
            );
          }

          // Determine kind and amount based on what's missing
          const isAdvanceNeeded = escrow.escrowStatus === 'PENDING';
          const kind = isAdvanceNeeded ? 'ADVANCE' : 'FINAL';
          const amount = isAdvanceNeeded ? escrow.advanceAmount : escrow.remainingAmount;

          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-1">
                  {isAdvanceNeeded ? '1. Pay Advance & Deposit' : '2. Pay Remaining Balance'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {isAdvanceNeeded 
                    ? 'Pay the initial amount to confirm your booking. This includes the security deposit which is held in escrow.'
                    : 'The item has been handed over. Please pay the remaining balance to complete the escrow funding.'}
                </p>
                <div className="flex items-center justify-between py-3 border-t border-gray-50">
                  <span className="text-sm font-medium text-gray-600">Amount due now</span>
                  <span className="text-lg font-bold text-emerald-600">₹{amount.toFixed(2)}</span>
                </div>
              </div>

              <RazorpayCheckout
                bookingId={booking.id}
                paymentKind={kind}
                amountToPay={amount}
                onSuccess={() => {
                  toast.success('Payment successful!');
                  refreshEscrow();
                  router.replace(`/payment/success?bookingId=${booking.id}`);
                }}
                onError={(err) => {
                  toast.error(`Payment failed: ${err}`);
                }}
                className="w-full h-14 bg-[#16a34a] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-[#15803d] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              />
            </div>
          );
        })()}

        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
          <Shield className="w-3.5 h-3.5" /> 256-bit SSL · Secured by Razorpay
        </p>
      </div>
    </div>
  );
}
