"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Calendar, ShieldCheck, MapPin, Loader2, Info, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing } from '@/services/listings';
import { createBooking } from '@/services/bookings';
import type { Listing } from '@/types';
import { formatCurrency, calculateDays } from '@/lib/utils';
import { SERVICE_FEE_PERCENTAGE } from '@/constants';
import Link from 'next/link';
import { payments, loadRazorpayScript } from '@/services/payments';
import Image from 'next/image';
import { Suspense } from 'react';

function CheckoutPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const startDateStr = searchParams.get('start');
  const endDateStr = searchParams.get('end');

  useEffect(() => {
    if (params.id) {
      getListing(params.id as string).then((data: any) => {
        setListing(data);
        setLoading(false);
      }).catch((err: any) => {
        toast.error('Failed to load listing for checkout');
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
        <span className="text-sm font-semibold text-[#6b7280]">Loading checkout...</span>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4">
      <div className="w-20 h-20 bg-[#f3f4f6] rounded-full flex items-center justify-center text-3xl">⚠️</div>
      <h2 className="text-2xl font-bold text-[#111827]">Item Unavailable</h2>
      <button onClick={() => router.back()} className="text-[#16a34a] hover:underline">Go back</button>
    </div>
  );

  if (!startDateStr || !endDateStr) return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4">
      <div className="w-20 h-20 bg-[#f3f4f6] rounded-full flex items-center justify-center text-3xl">📅</div>
      <h2 className="text-2xl font-bold text-[#111827]">Invalid dates specified</h2>
      <Link href={`/item/${listing.id}`} className="px-5 py-2.5 bg-[#16a34a] text-white rounded-xl font-semibold">
        Return to listing
      </Link>
    </div>
  );

  const days = calculateDays(startDateStr, endDateStr);
  if (days <= 0) return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-12 text-center text-red-500 font-bold text-xl">
      Invalid date range
    </div>
  );

  const rentalCost = days * listing.price_per_day;
  const serviceFee = rentalCost * SERVICE_FEE_PERCENTAGE;
  const securityDeposit = listing.security_deposit || 0;
  const totalAmount = rentalCost + serviceFee + securityDeposit;

  const handleConfirm = async () => {
    if (!user) {
      toast.error('You must be logged in to book');
      return;
    }
    setProcessing(true);
    try {
      const booking = await createBooking({
        listing_id: listing.id,
        store_id: listing.owner_id,
        owner_id: listing.owner_id,
        renter_id: user.id,
        check_in_date: startDateStr,
        check_out_date: endDateStr,
        rental_cost: rentalCost,
        service_fee: serviceFee,
        security_deposit: securityDeposit,
        total_amount: totalAmount
      });
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
          toast.error('Payment gateway failed to load.');
          return;
      }

      const { orderId, amount: paymentAmount, currency, razorpayKey } = await payments.initiate({
        bookingId: booking.id,
        amount: totalAmount,
        currency: 'INR'
      });

      const options = {
        key: razorpayKey || 'rzp_test_placeholder',
        amount: paymentAmount,
        currency: currency,
        name: 'GoRentals',
        description: `Booking: ${listing.title}`,
        order_id: orderId,
        handler: async (response: any) => {
            try {
                setProcessing(true);
                await payments.verify({
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature
                });
                
                router.push(`/payment/success?bookingId=${booking.id}&amount=${totalAmount}&title=${encodeURIComponent(listing.title)}&dates=${encodeURIComponent(`${new Date(startDateStr).toLocaleDateString()} - ${new Date(endDateStr).toLocaleDateString()}`)}`);
            } catch (err: any) {
                toast.error('Payment verification failed.');
            } finally {
                setProcessing(false);
            }
        },
        prefill: {
            name: user.fullName || '',
            email: user.email || '',
        },
        theme: {
            color: '#16a34a'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to process booking');
    } finally {
      setProcessing(false);
    }
  };

  const image = listing.listing_images?.[0]?.image_url || '/placeholder-item.jpg';

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-24">
      {/* Navbar for Checkout */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 sm:px-8 z-50">
        <Link href={`/item/${listing.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <span className="font-bold text-[#111827]">Secure Checkout</span>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-8">
          Confirm and pay
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left column - Details */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Booking Dates */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb]">
              <h2 className="text-xl font-bold text-[#111827] mb-4">Your trip</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#111827]">Dates</p>
                  <p className="text-[#6b7280]">
                    {new Date(startDateStr).toLocaleDateString()} – {new Date(endDateStr).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/item/${listing.id}`} className="text-sm font-semibold text-[#16a34a] hover:underline">
                  Edit
                </Link>
              </div>
            </div>

            {/* Insurance/Protection Banner */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb]">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <ShieldCheck className="w-8 h-8 text-[#16a34a]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] mb-1">GoRentals Protection Standard</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">
                    Your rental is comprehensively protected. Security deposits are held securely in escrow and automatically refunded post-return verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Rules / Disclaimer */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb]">
              <h3 className="font-bold text-[#111827] mb-3">Ground rules</h3>
              <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
                We ask every user to remember a few simple things about what makes a great renter:
              </p>
              <ul className="text-sm text-[#6b7280] list-disc pl-5 space-y-2">
                <li>Follow the owner's equipment rules.</li>
                <li>Treat the equipment like your own.</li>
                <li>Return the item on time and in the same condition.</li>
              </ul>
              <div className="mt-6 pt-6 border-t border-[#f3f4f6]">
                <p className="text-xs text-[#9ca3af]">
                  By clicking below, you agree to the GoRentals Terms of Service and authorize the initial escrow hold.
                </p>
              </div>
            </div>

          </div>

          {/* Right column - Summary Box */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-[#e5e7eb] sticky top-24">
              
              {/* Item Mini Card */}
              <div className="flex gap-4 pb-6 border-b border-[#f3f4f6] mb-6">
                <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-[#f3f4f6] shrink-0 border border-[#e5e7eb]">
                  <Image src={image} fill alt="" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">{listing.category}</span>
                  <h3 className="font-bold text-[#111827] line-clamp-2">{listing.title}</h3>
                </div>
              </div>

              <h2 className="text-lg font-bold text-[#111827] mb-4">Price details</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-[#374151]">
                  <span>{formatCurrency(listing.price_per_day)} × {days} days</span>
                  <span>{formatCurrency(rentalCost)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[#374151]">
                  <span className="flex items-center gap-1">
                    Platform fee
                    <Info className="w-3 h-3 text-[#9ca3af]" />
                  </span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>

                <div className="pt-4 border-t border-[#f3f4f6] flex justify-between items-center">
                  <span className="font-bold text-[#111827]">Total (INR)</span>
                  <span className="font-bold text-[#111827]">{formatCurrency(rentalCost + serviceFee)}</span>
                </div>
              </div>

              {/* Security Deposit Box */}
              <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Security Deposit</span>
                  <span className="font-semibold text-[#111827]">{formatCurrency(securityDeposit)}</span>
                </div>
                <p className="text-xs text-[#6b7280]">Fully refunded upon safe return</p>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="font-bold text-[#111827] text-lg">Total payment</span>
                <span className="font-bold text-[#16a34a] text-2xl">{formatCurrency(totalAmount)}</span>
              </div>

              <button 
                 onClick={handleConfirm}
                 disabled={processing}
                 className="w-full h-14 bg-[#111827] hover:bg-[#374151] text-white text-base font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:bg-[#111827] shadow-sm"
              >
                 {processing ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                 ) : (
                   `Pay ${formatCurrency(totalAmount)}`
                 )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
          <span className="text-sm font-semibold text-[#6b7280]">Loading...</span>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
