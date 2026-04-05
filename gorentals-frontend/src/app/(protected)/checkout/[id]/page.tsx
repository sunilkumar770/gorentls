"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Calendar, ShieldCheck, MapPin, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getListingById } from '@/services/listings';
import { createBooking } from '@/services/bookings';
import type { Listing } from '@/types';
import { formatCurrency, calculateDays } from '@/lib/utils';
import { SERVICE_FEE_PERCENTAGE } from '@/constants';
import Link from 'next/link';

export default function CheckoutPage() {
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
      getListingById(params.id as string).then(data => {
        setListing(data);
        setLoading(false);
      }).catch(err => {
        toast.error('Failed to load listing for checkout');
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#fff8f6] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#f97316]/20 border-t-[#f97316] animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Processing Request...</span>
      </div>
    </div>
  );

  if (!listing) return (
     <div className="min-h-screen bg-[#fff8f6] p-24 text-center">
        <h2 className="text-3xl font-display font-black text-[#251913]">Artifact Unavailable</h2>
     </div>
  );

  if (!startDateStr || !endDateStr) return (
     <div className="min-h-screen bg-[#fff8f6] p-24 text-center">
        <h2 className="text-3xl font-display font-black text-[#8c7164]">Invalid Chronology specified. Return to artifact menu.</h2>
     </div>
  );

  const days = calculateDays(startDateStr, endDateStr);
  if (days <= 0) return <div className="p-12 text-center text-red-500">Invalid date range</div>;

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
      await createBooking({
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
      
      toast.success('Acquisition request filed successfully.');
      router.push('/dashboard');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-10 flex items-center gap-4">
          <Link href={`/item/${listing.id}`} className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] hover:text-[#f97316] transition-colors">
            &larr; Back to {listing.title}
          </Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-black text-[#251913] leading-none mb-12 tracking-tighter">
          Confirm <br/><span className="text-[#f97316]">Acquisition.</span>
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left column - Details */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-ambient ring-1 ring-[#f97316]/5 transform transition-all">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8c7164] mb-6">Subject Blueprint</h2>
              <div className="flex gap-6 items-center">
                {listing.listing_images?.[0] ? (
                  <img src={listing.listing_images[0].image_url} alt={listing.title} className="w-32 h-32 object-cover rounded-[1.5rem] shadow-sm" />
                ) : (
                  <div className="w-32 h-32 bg-[#fff8f6] rounded-[1.5rem] flex items-center justify-center shadow-inner">
                    <span className="text-[#8c7164] text-[10px] font-black uppercase tracking-widest">No Image</span>
                  </div>
                )}
                <div>
                  <h3 className="text-3xl font-display font-black text-[#251913] leading-none mb-2 tracking-tight">{listing.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f97316] mb-4">{listing.category} &bull; {listing.subcategory}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold text-[#8c7164] tracking-widest">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[#fff8f6] rounded-full border border-[#251913]/5">
                       <MapPin className="w-3 h-3 text-[#f97316]" /> Regional Verification
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-ambient ring-1 ring-[#f97316]/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8c7164] mb-6">Chronology</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 bg-[#fff8f6] p-6 rounded-[1.5rem] border border-[#251913]/5">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316] mb-1">Retrieval Date</p>
                  <p className="font-display font-black text-xl text-[#251913]">{new Date(startDateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="hidden sm:block h-12 w-px bg-[#251913]/10"></div>
                <div className="sm:hidden w-full h-px bg-[#251913]/10"></div>
                <div className="flex-1 sm:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] mb-1">Return Date</p>
                  <p className="font-display font-black text-xl text-[#251913]">{new Date(endDateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-ambient ring-1 ring-[#f97316]/5 border-l-4 border-l-[#f97316]">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-[#fff8f6] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                   <ShieldCheck className="w-6 h-6 text-[#f97316]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-[#251913] mb-1">GoRentals Protection Standard</h3>
                  <p className="text-sm text-[#8c7164] font-medium leading-relaxed tracking-tight">Your artifact is comprehensively insured up to ₹1,00,000 via our global escrow protocol. Security deposits are unconditionally remitted post-return verification.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Pricing summary */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_48px_96px_rgba(37,25,19,0.15)] ring-1 ring-[#f97316]/5 sticky top-32">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#8c7164] mb-8 border-b border-[#251913]/5 pb-4">Financial Ledger</h2>
              
              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center text-[#584237] font-medium">
                  <span>{formatCurrency(listing.price_per_day)} <span className="mx-1 text-[#8c7164]">×</span> {days} Days</span>
                  <span className="font-black text-[#251913]">{formatCurrency(rentalCost)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[#584237] font-medium">
                  <span className="flex items-center gap-1 group">
                    Platform Fee (10%)
                    <Info className="w-3 h-3 text-[#f97316]" />
                  </span>
                  <span className="font-black text-[#251913]">{formatCurrency(serviceFee)}</span>
                </div>

                <div className="h-px bg-[#251913]/10 my-6"></div>

                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8c7164]">Immediate Remittance</span>
                  <span className="text-4xl font-display font-black text-[#251913]">{formatCurrency(rentalCost + serviceFee)}</span>
                </div>

                <div className="flex justify-between items-center py-4 px-6 bg-[#fff8f6] rounded-[1.5rem] ring-1 ring-[#f97316]/20">
                  <span className="text-xs font-black uppercase tracking-widest text-[#f97316]">Escrow Deposit</span>
                  <span className="font-black text-[#251913]">{formatCurrency(securityDeposit)}</span>
                </div>
              </div>

              <button 
                 onClick={handleConfirm}
                 disabled={processing}
                 className="gradient-signature w-full h-16 text-white text-xl font-display font-black rounded-[1.5rem] shadow-ambient transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50"
              >
                 {processing ? (
                   <><Loader2 className="w-6 h-6 animate-spin" /> Authorizing...</>
                 ) : (
                   `Authorize Transfer • ${formatCurrency(totalAmount)}`
                 )}
              </button>
              
              <p className="text-center text-[9px] text-[#8c7164] font-black uppercase tracking-[0.2em] mt-6 opacity-60">
                You will not be debited until<br/>owner consent is granted.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
