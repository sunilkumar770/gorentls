'use client';

import { useParams } from 'next/navigation';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { MapPin, Star, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { listing, loading } = useListing(id);
  const { user } = useAuth();

  if (loading) return (
    <div className="max-w-7xl mx-auto p-8 py-20 min-h-screen bg-[#fff8f6]">
      <div className="animate-pulse flex flex-col gap-8">
        <div className="h-[400px] bg-white rounded-[2.5rem] shadow-sm" />
        <div className="h-10 w-1/3 bg-white rounded-full" />
      </div>
    </div>
  );

  if (!listing) return (
    <div className="max-w-7xl mx-auto p-20 text-center min-h-screen bg-[#fff8f6]">
      <h2 className="text-3xl font-display font-black text-[#251913]">Artifact Not Found</h2>
      <Link href="/search" className="text-[#f97316] font-bold mt-4 inline-block underline">Return to Archive</Link>
    </div>
  );

  const primaryImage = listing.listing_images?.find(img => img.is_primary)?.image_url || 
                       listing.listing_images?.[0]?.image_url || 
                       '/placeholder-item.jpg';
  
  const store = Array.isArray(listing.stores) ? listing.stores[0] : listing.stores;
  const conditionMap = {
    like_new: 'Pristine', excellent: 'Exceptional', good: 'Curated', fair: 'Vintage'
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Navigation Breadcrumb / Control */}
        <div className="mb-10 flex items-center gap-4">
          <Link href="/search" className="text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] hover:text-[#f97316] transition-colors">
            &larr; Back to Archive
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Gallery: The Visual Centerpiece */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden bg-white shadow-ambient ring-1 ring-[#f97316]/5">
              <Image 
                src={primaryImage} 
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              {/* Image Label Overlay */}
              <div className="absolute bottom-10 left-10">
                 <div className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#251913] shadow-md">
                   Authentic Artifact
                 </div>
              </div>
            </div>
            
            {/* Editorial Content */}
            <div className="flex flex-col gap-8 max-w-3xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#ffeae0] text-[#9d4300] text-[10px] font-black uppercase tracking-widest rounded-full">{listing.category}</span>
                  <span className="px-3 py-1 bg-[#fff] border border-[#f97316]/10 text-[#251913] text-[10px] font-black uppercase tracking-widest rounded-full">{conditionMap[listing.condition]}</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-[#251913] leading-[0.9]">
                  {listing.title}
                </h1>
              </div>

              <div className="prose prose-stone prose-lg">
                <p className="text-[#584237] leading-relaxed font-medium tracking-tight whitespace-pre-wrap text-xl">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
              
              {/* Owner Info: The Trusted Partner */}
              <div className="mt-8 p-10 bg-white rounded-[2rem] shadow-ambient ring-1 ring-[#f97316]/5 flex flex-col sm:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-[#fff8f6] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <User className="h-10 w-10 text-[#f97316]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-display font-black text-[#251913] mb-1">{store?.store_name || 'Legacy Collector'}</h3>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-sm font-bold uppercase tracking-wider text-[#8c7164]">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
                      <span className="text-[#251913]">{store?.store_rating?.toFixed(1) || '5.0'} Rating</span>
                    </div>
                    <span className="hidden sm:block">•</span>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                      <span>{store?.verification_status === 'verified' ? 'Verified Partner' : 'Authenticating'}</span>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="bg-[#fff8f6] text-[#251913] font-black rounded-full px-8 hover:bg-[#ffeae0]">
                   View Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: The Transaction Artifact */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(37,25,19,0.15)] ring-1 ring-[#f97316]/10 flex flex-col gap-8 relative overflow-hidden">
                {/* Decorative Tonal Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/5 rounded-full -mr-16 -mt-16" />
                
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-display font-black tracking-tighter text-[#251913]">
                      {formatCurrency(listing.price_per_day)}
                    </span>
                    <span className="text-[#8c7164] font-black uppercase text-xs tracking-tighter pb-2">/ Day</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8c7164] font-bold uppercase tracking-wider">
                    <MapPin className="h-4 w-4 text-[#f97316]" />
                    {store?.store_city || 'Regional Archive'}
                  </div>
                </div>

                <div className="space-y-4 py-8 border-y border-[#251913]/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[#8c7164] uppercase tracking-widest text-[10px]">Vault Deposit</span>
                    <span className="font-display font-black text-[#251913]">{formatCurrency(listing.security_deposit)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-[#8c7164] uppercase tracking-widest text-[10px]">Minimum Term</span>
                    <span className="font-display font-black text-[#251913]">24 Hours</span>
                  </div>
                </div>

                {user ? (
                  <Link href={`/checkout/${listing.id}`} className="block w-full">
                    <Button size="lg" className="gradient-signature w-full h-16 text-white text-xl font-display font-black rounded-2xl shadow-ambient transition-transform hover:-translate-y-1 active:scale-95">
                      Request Artifact
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/login?redirect=/item/${listing.id}`} className="block w-full">
                    <Button size="lg" className="bg-[#251913] text-white w-full h-16 text-xl font-display font-black rounded-2xl shadow-ambient transition-transform hover:-translate-y-1">
                      Identity Required
                    </Button>
                  </Link>
                )}
                
                <p className="text-center text-[10px] text-[#8c7164] font-bold uppercase tracking-[0.1em] opacity-60">
                  Secured by GoRentals Escrow Protocol
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
