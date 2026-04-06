"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CATEGORIES } from '@/constants';
import api from '@/lib/axios';
import { Camera, ImagePlus, Loader2, MapPin, CheckCircle2, Package, Tag, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Quick lookup for category emojis
const getCategoryEmoji = (val: string) => {
  const c = CATEGORIES.find(c => c.value === val);
  if (c && c.label.includes(' ')) return c.label.split(' ')[0];
  switch(val.toLowerCase()) {
    case 'cameras': return '📸';
    case 'gaming': return '🎮';
    case 'tools': return '🔧';
    case 'camping': return '⛺';
    case 'audio': return '🎵';
    default: return '📦';
  }
};

export default function CreateListingWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0].value as string,
    type: '',
    pricePerDay: '',
    securityDeposit: '',
    location: '',
    city: '',
    state: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages(prev => [...prev, ...selected]);
    }
  };

  const uploadImagesToCloudinary = async (): Promise<string[]> => {
    // Note: Mocking this until real Cloudinary is plugged in
    return ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'];
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const imageUrls = await uploadImagesToCloudinary();
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type || formData.category,
        pricePerDay: Number(formData.pricePerDay),
        securityDeposit: Number(formData.securityDeposit),
        location: formData.location,
        city: formData.city,
        state: formData.state,
        images: imageUrls,
        isAvailable: true,
        isPublished: true,
      };

      const res = await api.post('/listings', payload);
      toast.success('Listing published successfully!');
      router.push(`/item/${res.data.id}`);
    } catch (error: any) {
      toast.error('Failed to create listing');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  // --- Step Rendering Helpers ---
  const renderStepIcon = (iconStep: number) => {
    const isCompleted = step > iconStep;
    const isCurrent = step === iconStep;
    
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-white" />;
    }
    return <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-[#6b7280]'}`}>{iconStep}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      {/* Top Navigation Bar for Wizard */}
      <div className="bg-white border-b border-[#e5e7eb] sticky top-0 z-10 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm font-medium text-[#6b7280] hover:text-[#111827]">
            Exit
          </button>
          <div className="text-sm font-bold text-[#111827]">
            List an item
          </div>
          <div className="text-sm font-medium text-[#6b7280]">
            Step {step} of {totalSteps}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-[#f3f4f6] h-1">
          <div 
            className="bg-[#16a34a] h-1 transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        
        {/* Wizard Progress Nodes */}
        <div className="hidden sm:flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#e5e7eb] -z-10" />
          <div 
            className="absolute top-1/2 left-8 h-0.5 bg-[#16a34a] -z-10 transition-all duration-500" 
            style={{ width: `calc(${((step - 1) / (totalSteps - 1)) * 100}% - 4rem)` }}
          />

          {[
            { id: 1, label: 'Details', icon: Package },
            { id: 2, label: 'Location', icon: MapPin },
            { id: 3, label: 'Photos', icon: Camera },
            { id: 4, label: 'Pricing', icon: Tag },
          ].map((item) => {
            const isCompleted = step > item.id;
            const isCurrent = step === item.id;
            return (
              <div key={item.id} className="flex flex-col items-center gap-3 bg-[#f9fafb] px-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isCompleted 
                    ? 'bg-[#16a34a] border-[#16a34a]' 
                    : isCurrent 
                      ? 'bg-[#16a34a] border-[#16a34a]' 
                      : 'bg-white border-[#e5e7eb]'
                }`}>
                  {renderStepIcon(item.id)}
                </div>
                <span className={`text-xs font-semibold ${isCurrent || isCompleted ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 md:p-10 min-h-[400px]">
          
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">What are you listing?</h2>
              <p className="text-[#6b7280] mb-8">Provide clear, accurate details to attract the right renters.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Item title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
                    placeholder="e.g. Sony A7IV Mirrorless Camera Body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Category *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => {
                      const isSelected = formData.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.value as string })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected 
                              ? 'border-[#16a34a] bg-[#f0fdf4] ring-1 ring-[#16a34a]/30' 
                              : 'border-[#e5e7eb] hover:border-[#d1d5db] bg-white'
                          }`}
                        >
                          <div className="text-lg mb-1">{getCategoryEmoji(cat.value as string)}</div>
                          <div className={`text-sm font-medium ${isSelected ? 'text-[#15803d]' : 'text-[#4b5563]'}`}>
                            {cat.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] resize-none"
                    placeholder="Describe the condition, what's included in the box, and any usage rules."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Where is the item located?</h2>
              <p className="text-[#6b7280] mb-8">Renters will see the general area before booking.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
                    placeholder="e.g. Bengaluru"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
                      placeholder="e.g. Karnataka"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Locality / Neighborhood *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
                      placeholder="e.g. Indiranagar Component"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Add clear photos</h2>
              <p className="text-[#6b7280] mb-8">Good lighting and multiple angles increase rental chances.</p>
              
              <div className="border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] hover:bg-[#f0fdf4] hover:border-[#16a34a]/50 transition-colors rounded-2xl p-10 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="images"
                  onChange={handleImageChange}
                />
                <label htmlFor="images" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-[#e5e7eb]">
                    <ImagePlus className="w-8 h-8 text-[#16a34a]" />
                  </div>
                  <span className="text-lg font-bold text-[#111827] mb-1">
                    Click to upload
                  </span>
                  <span className="text-sm font-medium text-[#6b7280]">
                    Up to 5 images • PNG, JPG
                  </span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-[#f3f4f6] ring-1 ring-[#e5e7eb] shadow-sm group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button
                           type="button"
                           onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                           className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#111827] shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                         >
                           &times;
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Pricing */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">Set your pricing</h2>
              <p className="text-[#6b7280] mb-8">Competitive rates mean more frequent bookings.</p>
              
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Daily Rental Rate (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.pricePerDay}
                      onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] text-lg font-bold"
                      placeholder="500"
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] mt-2">The amount you earn per 24-hour period.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Security Deposit (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-medium">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.securityDeposit}
                      onChange={e => setFormData({ ...formData, securityDeposit: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827] text-lg font-bold"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] mt-2">Held securely during the rental, returned if the item is undamaged.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-[#374151] hover:bg-[#f3f4f6]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#111827] hover:bg-[#374151] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.title || !formData.pricePerDay || !formData.category}
              className="flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
