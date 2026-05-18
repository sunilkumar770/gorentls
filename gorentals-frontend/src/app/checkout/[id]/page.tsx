'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getBooking } from '@/services/bookings';
import type { Booking } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, ChevronLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { RazorpayCheckout } from '@/components/payment/RazorpayCheckout';
import { toast } from 'react-hot-toast';

function CheckoutPaymentContent({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !isLoading) {
      router.push(`/login?redirect=/checkout/${bookingId}`);
    }
  }, [user, isLoading, bookingId, router]);

  useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true);
        const data = await getBooking(bookingId);
        if (data) {
          setBooking(data);
          if (data.status !== 'PENDING_PAYMENT') {
            router.push(`/payment/success?bookingId=${bookingId}`);
          }
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
        setError('Connection error while fetching booking details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted font-medium">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4 bg-subtle">
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-sm">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text tracking-tight">{error || 'Booking not found'}</h2>
          <p className="text-muted font-medium max-w-xs mx-auto">The booking you are trying to pay for is invalid or already processed.</p>
        </div>
        <Link href="/my-rentals" className="bg-indigo-600 text-white font-bold px-10 py-4 rounded-2xl hover:bg-indigo-700 transition-all text-sm shadow-xl shadow-indigo-100">
          Back to rentals
        </Link>
      </div>
    );
  }

  const paymentKind = 'ADVANCE'; // GoRentals initial setup handles full amount as ADVANCE

  return (
    <div className="min-h-screen bg-subtle pb-24">
      {/* Navigation Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center">
          <Link href="/my-rentals" className="flex items-center gap-2 text-muted hover:text-indigo-600 transition-colors group font-bold text-xs uppercase tracking-widest">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Rentals</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-text tracking-tight">Complete Payment</h1>
            <p className="text-sm font-medium text-muted">Booking #{booking.id.split('-')[0].toUpperCase()}</p>
          </div>

          <div className="bg-card rounded-[3rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-slate-100">
            <h3 className="text-2xl font-bold text-text mb-8 tracking-tight">Summary</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                <span>Gear</span>
                <span className="text-text truncate max-w-[200px] text-right">{booking.listing?.title}</span>
              </div>
              <div className="flex justify-between text-muted font-bold text-sm uppercase tracking-wider">
                <span>Total Amount Due</span>
                <span className="text-text text-xl">{formatCurrency(booking.totalAmount)}</span>
              </div>
              
              <div className="pt-10 mt-6 border-t border-slate-100 flex flex-col items-center">
                <RazorpayCheckout
                  bookingId={booking.id}
                  paymentKind={paymentKind}
                  amountToPay={booking.totalAmount}
                  onSuccess={() => {
                    toast.success('Payment completed successfully!');
                    router.push(`/payment/success?bookingId=${booking.id}`);
                  }}
                  onError={(err) => {
                    setError(err);
                    toast.error(err);
                  }}
                  className="w-full sm:w-auto min-w-[250px] h-16 rounded-2xl text-lg shadow-xl shadow-indigo-100"
                />

                {error && (
                  <div className="mt-6 w-full p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm font-bold text-left animate-in fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-[2.5rem] p-8 flex items-start gap-6 border border-indigo-100">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-lg text-indigo-900 tracking-tight">Secure Payment</h4>
              <p className="text-sm text-indigo-800/80 leading-relaxed mt-2 font-medium">
                Your payment is processed securely via Razorpay and held in escrow. 
                Funds are only released to the owner after you pick up and verify the gear.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-subtle pb-20 animate-pulse">
        <div className="h-20 bg-card border-b border-slate-100" />
      </div>
    }>
      <CheckoutPaymentContent bookingId={id} />
    </Suspense>
  );
}
