'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import AddressPicker, { type AddressUpdate } from '@/components/maps/AddressPicker';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Listing } from '@/types';

const CATEGORIES = [
  'Electronics','Furniture','Vehicles','Tools & Equipment','Sports & Fitness',
  'Books & Stationery','Clothing & Accessories','Photography',
  'Musical Instruments','Home Appliances','Party & Events','Other',
] as const;

const CONDITIONS = [
  { value: 'NEW',      label: 'New — Never used' },
  { value: 'LIKE_NEW', label: 'Like New — Minimal wear' },
  { value: 'GOOD',     label: 'Good — Normal wear' },
  { value: 'FAIR',     label: 'Fair — Visible wear' },
  { value: 'POOR',     label: 'Poor — Heavily worn' },
] as const;

interface FormState {
  title:           string;
  description:     string;
  category:        string;
  condition:       string;
  pricePerDay:     string;
  securityDeposit: string;
  city:            string;
  state:           string;
  address:         string;
  isAvailable:     boolean;
  isPublished:     boolean;
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form,       setForm]       = useState<FormState | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [addressVal, setAddressVal] = useState('');

  useEffect(() => {
    api.get<Listing>(`/listings/${id}`)
      .then(res => {
        const l = res.data;
        setForm({
          title:           l.title           ?? '',
          description:     l.description     ?? '',
          category:        l.category        ?? '',
          condition:       l.condition       ?? '',
          pricePerDay:     String(l.pricePerDay     ?? ''),
          securityDeposit: String(l.securityDeposit ?? ''),
          city:            l.city   ?? '',
          state:           l.state  ?? '',
          address:         l.address ?? '',
          isAvailable:     l.isAvailable ?? true,
          isPublished:     l.isPublished ?? true,
        });
        // Compose address string for Maps picker
        setAddressVal(
          [l.address, l.city, l.state].filter(Boolean).join(', ')
        );
        setLoading(false);
      })
      .catch(() => { toast.error('Listing not found.'); router.back(); });
  }, [id, router]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const val = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value;
    setForm(p => p ? { ...p, [name]: val } : p);
  }

  function handleAddressChange(updates: AddressUpdate) {
    setForm(p => p ? {
      ...p,
      ...(updates.location !== undefined ? { address: updates.location } : {}),
      ...(updates.city     !== undefined ? { city:    updates.city     } : {}),
      ...(updates.state    !== undefined ? { state:   updates.state    } : {}),
    } : p);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await api.put(`/listings/${id}`, {
        title:           form.title.trim(),
        description:     form.description.trim(),
        category:        form.category,
        condition:       form.condition,
        pricePerDay:     Number(form.pricePerDay),
        securityDeposit: Number(form.securityDeposit || 0),
        city:            form.city.trim(),
        state:           form.state.trim() || null,
        address:         form.address.trim() || null,
        isAvailable:     form.isAvailable,
        isPublished:     form.isPublished,
      });
      toast.success('✅ Listing updated!');
      router.push('/owner/listings');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed — please retry.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-4 border-[#16a34a]/20 border-t-[#16a34a] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900
                           mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Visibility toggles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Visibility</h2>
            <div className="space-y-3">
              {(
                [
                  { field: 'isPublished', icon: Eye, label: 'Published', sub: 'Visible in search results' },
                  { field: 'isAvailable', icon: Eye, label: 'Available to book', sub: 'Renters can create bookings' },
                ] as const
              ).map(({ field, label, sub }) => (
                <label key={field}
                       className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" name={field}
                           checked={form[field] as boolean}
                           onChange={handleChange}
                           className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer
                                    peer-checked:bg-[#16a34a] transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                                    shadow-sm transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Item details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Item details</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input name="title" value={form.title} onChange={handleChange} required
                     className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea name="description" rows={4} value={form.description}
                        onChange={handleChange} maxLength={1000} required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                   resize-none focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30
                                   focus:border-[#16a34a]" />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {form.description.length}/1000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                   bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                   bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30">
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              {(['pricePerDay', 'securityDeposit'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {field === 'pricePerDay' ? 'Daily rate *' : 'Security deposit'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                    <input type="number" name={field} value={form[field]}
                           onChange={handleChange} min="0"
                           required={field === 'pricePerDay'}
                           className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                                      focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location with Google Maps */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Location</h2>
            <AddressPicker
              location={form.address}
              city={form.city}
              state={form.state}
              onAddressChange={handleAddressChange}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold
                               rounded-2xl hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-3 bg-[#16a34a] text-white font-bold rounded-2xl
                               flex items-center justify-center gap-2 hover:bg-[#15803d]
                               disabled:opacity-60 transition-colors text-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
