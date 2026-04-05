"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CATEGORIES } from '@/constants';
import api from '@/lib/axios';
import { Camera, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    toast.error('Image upload not fully configured yet — using placeholder');
    return ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Listing created successfully!');
      router.push(`/item/${res.data.id}`);
      
    } catch (error: any) {
      toast.error('Failed to create listing');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f6] pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Header */}
        <div className="mb-12 flex items-end gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-lg transform -rotate-3">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div className="pb-2">
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter text-[#251913] leading-none mb-2">
              Add Artifact
            </h1>
            <p className="text-[#8c7164] font-medium tracking-tight">Deploy your equipment to the global archive.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Basic Info */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_32px_64px_rgba(37,25,19,0.06)] ring-1 ring-[#f97316]/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">Core Details</h2>
              <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Nomenclature (Title)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                  placeholder="e.g. Sony a7III Mirrorless Camera Body"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30 resize-none"
                  placeholder="Detail condition, inclusions, and special instructions."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Classification</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Specific Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                    placeholder="e.g. Optics, Lenses"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Location */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Pricing */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(37,25,19,0.06)] ring-1 ring-[#f97316]/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-black text-[#251913] uppercase tracking-tighter">Valuation</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Daily Rate (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.pricePerDay}
                    onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-display font-black text-2xl outline-none placeholder-[#8c7164]/30"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.securityDeposit}
                    onChange={e => setFormData({ ...formData, securityDeposit: e.target.value })}
                    className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-display font-black text-2xl outline-none placeholder-[#8c7164]/30"
                    placeholder="15000"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(37,25,19,0.06)] ring-1 ring-[#f97316]/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display font-black text-[#251913] uppercase tracking-tighter">Origin</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">City Region</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                    placeholder="Bengaluru"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Zone/State</label>
                     <input
                       type="text"
                       required
                       value={formData.state}
                       onChange={e => setFormData({ ...formData, state: e.target.value })}
                       className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                       placeholder="KA"
                     />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#8c7164] mb-3">Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-6 py-4 bg-[#fff8f6] border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-[#f97316] focus:bg-white transition-all text-[#251913] font-bold outline-none placeholder-[#8c7164]/30"
                      placeholder="Indiranagar"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_32px_64px_rgba(37,25,19,0.06)] ring-1 ring-[#f97316]/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-black text-[#251913] uppercase tracking-tighter">Media Assets</h2>
              <div className="h-px flex-1 bg-[#251913]/5 mx-6" />
            </div>
            
            <div className="border-[3px] border-dashed border-[#f97316]/20 bg-[#fff8f6] rounded-[2rem] p-12 text-center hover:border-[#f97316]/50 hover:bg-orange-50/50 transition-all duration-300">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="images"
                onChange={handleImageChange}
              />
              <label htmlFor="images" className="cursor-pointer flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-[#f97316]/50" />
                </div>
                <span className="text-xl font-display font-black text-[#251913] mb-2 tracking-tight">
                  Upload Digital Artifacts
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-[#8c7164]">
                  Max 5 items &bull; PNG, JPG, WEBP
                </span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mt-8">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-white shadow-ambient ring-1 ring-black/5 group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt="Preview"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button
                         type="button"
                         onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                         className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#251913] font-bold shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                       >
                         &times;
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-6 border-t border-[#251913]/5">
            <button 
               type="button" 
               className="text-[#8c7164] font-black uppercase tracking-widest text-xs hover:text-[#251913] transition-colors"
               onClick={() => router.back()}
            >
              Cancel Creation
            </button>
            <button 
               type="submit" 
               className="gradient-signature px-10 py-5 text-white rounded-[1.5rem] font-display font-black text-xl shadow-ambient transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 w-full sm:w-auto text-center flex justify-center items-center gap-3" 
               disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Finalizing...</>
              ) : (
                'Publish Alignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
