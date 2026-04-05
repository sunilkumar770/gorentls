'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createListing } from '@/services/listings';
import { Package, Plus, Image as ImageIcon, MapPin, DollarSign, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

const CATEGORIES = ['Photography', 'Laptops', 'Audio', 'Gaming', 'Drones', 'Appliances'];
const TYPES = ['Professional', 'Consumer', 'Vintage', 'Modern'];
const CONDITIONS = [
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' }
];

export default function CreateListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Photography',
    subcategory: 'Professional',
    description: '',
    condition: 'excellent' as const,
    price_per_day: 0,
    security_deposit: 0,
    city: '',
    listing_images: [] as { image_url: string; is_primary: boolean; display_order: number }[]
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add default image if none provided to avoid broken UI
      const finalImages = formData.listing_images.length > 0 
        ? formData.listing_images 
        : [{ image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }];

      await createListing({
        ...formData,
        store_id: '', // Backend handles this from @AuthenticationPrincipal
        owner_id: '',
        brand: '',
        price_per_week: null,
        price_per_month: null,
        is_published: true,
        is_available: true,
        listing_images: finalImages as any
      });
      
      router.push('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Progress Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-display font-black text-[#251913] tracking-tight">
            List Your <span className="text-[#f97316]">Gear</span>
          </h1>
          <p className="text-[#8c7164] font-medium mt-2">Finish these 4 steps to start earning.</p>
          
          <div className="flex justify-center gap-3 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
                  step >= i ? 'bg-[#f97316]' : 'bg-[#251913]/5'
                }`} 
              />
            ))}
          </div>
        </div>

        <Card className="p-8 md:p-12 bg-white border-none shadow-ambient rounded-[3rem] overflow-hidden relative">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 rotate-45" />
              {error}
            </div>
          )}

          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">What are you listing?</label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Sony A7IV Mirrorless Camera"
                  className="h-16 text-xl font-bold rounded-2xl border-[#251913]/5 focus:border-[#f97316] focus:ring-[#f97316]/10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl bg-[#fff8f6] border-none font-bold text-[#251913] focus:ring-2 focus:ring-[#f97316]/20"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Type</label>
                  <select 
                    value={formData.subcategory}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl bg-[#fff8f6] border-none font-bold text-[#251913] focus:ring-2 focus:ring-[#f97316]/20"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Tell us about it</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the condition, features, and target users..."
                  className="min-h-[150px] rounded-2xl border-[#251913]/5 focus:border-[#f97316] font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Condition</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setFormData({...formData, condition: c.value as any})}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        formData.condition === c.value 
                        ? 'bg-[#251913] text-white shadow-lg' 
                        : 'bg-[#fff8f6] text-[#8c7164] hover:bg-[#251913]/5'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Price Per Day (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8c7164]" />
                    <Input 
                      type="number"
                      value={formData.price_per_day}
                      onChange={(e) => setFormData({...formData, price_per_day: Number(e.target.value)})}
                      className="pl-12 h-16 text-xl font-bold rounded-2xl border-[#251913]/5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Security Deposit (₹)</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8c7164]" />
                    <Input 
                      type="number"
                      value={formData.security_deposit}
                      onChange={(e) => setFormData({...formData, security_deposit: Number(e.target.value)})}
                      className="pl-12 h-16 text-xl font-bold rounded-2xl border-[#251913]/5"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8c7164] opacity-60">
                Security deposit is fully refundable to the renter after a successful return.
              </p>
            </div>
          )}

          {/* STEP 4: FINAL */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#8c7164]">Pick-up City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8c7164]" />
                  <Input 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g. Mumbai, Bangalore"
                    className="pl-12 h-16 text-xl font-bold rounded-2xl border-[#251913]/5"
                  />
                </div>
              </div>

              <div className="p-6 bg-[#fff8f6] rounded-3xl space-y-4">
                <h4 className="font-display font-black text-[#251913]">Review Submission</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8c7164] font-medium">Monthly Potential Earnings (est.)</span>
                  <span className="font-black text-green-600">₹{formData.price_per_day * 20}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8c7164] font-medium">Platform Fee (15%)</span>
                  <span className="font-black text-red-500">-₹{((formData.price_per_day * 20) * 0.15).toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-12 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="text-[#8c7164] font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
              <Button 
                onClick={handleNext}
                className="bg-[#251913] text-white rounded-2xl px-10 py-6 font-display font-black uppercase tracking-widest"
              >
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                loading={loading}
                className="bg-[#f97316] text-white rounded-2xl px-10 py-6 font-display font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_60px_rgba(249,115,22,0.4)]"
              >
                Launch Listing
                {!loading && <CheckCircle2 className="h-4 w-4 ml-2" />}
              </Button>
            )}
          </div>

        </Card>

      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
